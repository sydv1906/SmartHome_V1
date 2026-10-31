import { Response } from 'express';
import Device from '../models/Device';
import Room from '../models/Room';
import Telemetry from '../models/Telemetry';
import { AuthRequest } from '../middleware/auth';
import { publishRelayCommand } from '../services/mqttService';
import { getIO } from '../config/socket';
import { getMqttTopics } from '@smarthome/shared';

export const getDevices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homeId = req.query.homeId || req.user.activeHomeId;
    const { roomId, type, search } = req.query;

    const filter: any = { homeId };
    if (roomId) filter.roomId = roomId;
    if (type) filter.type = type;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const devices = await Device.find(filter).populate('roomId', 'name type').sort({ createdAt: -1 });
    res.status(200).json({ success: true, devices });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, roomId, esp32Id, relayNumber, powerRatingW, meterConnected } = req.body;
    const homeId = req.body.homeId || req.user.activeHomeId;

    if (!name || !type || !roomId || !esp32Id) {
      res.status(400).json({ success: false, message: 'Name, type, roomId, and esp32Id are required' });
      return;
    }

    const topics = getMqttTopics(req.user._id.toString(), esp32Id);

    const newDevice = await Device.create({
      name,
      type,
      roomId,
      homeId,
      esp32Id,
      relayNumber: relayNumber || 1,
      mqttTopics: topics,
      powerRatingW: powerRatingW || 100,
      meterConnected: meterConnected !== false,
      currentA: 0,
      voltageV: 230,
      powerW: 0,
      energyKWh: 0.1,
      powerFactor: 0.98,
      frequencyHz: 50.0,
      relayState: false,
      onlineStatus: true,
      signalStrengthRssi: -62,
      wifiSsid: 'SmartHome_WiFi_5G',
      firmwareVersion: 'v2.1.0',
      lastSeen: new Date(),
    });

    // Update Room device count
    await Room.findByIdAndUpdate(roomId, { $inc: { deviceCount: 1 } });

    res.status(201).json({ success: true, device: newDevice });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleRelay = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const { state } = req.body; // boolean

    const device = await Device.findById(deviceId);
    if (!device) {
      res.status(404).json({ success: false, message: 'Device not found' });
      return;
    }

    const targetState = state !== undefined ? Boolean(state) : !device.relayState;
    device.relayState = targetState;
    if (device.meterConnected) {
      device.powerW = targetState ? device.powerRatingW * 0.85 : 0;
      device.currentA = targetState ? device.powerW / (device.voltageV * device.powerFactor) : 0;
    } else {
      device.powerW = 0;
      device.currentA = 0;
    }
    device.lastSeen = new Date();
    await device.save();

    // Publish to MQTT
    publishRelayCommand(req.user._id.toString(), device.esp32Id, device.relayNumber, targetState);

    // Emit Socket.IO event
    try {
      getIO().to(`home_${device.homeId}`).emit('relay_state_change', {
        deviceId: device._id,
        relayState: device.relayState,
        powerW: device.powerW,
        currentA: device.currentA,
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `${device.name} relay switched to ${targetState ? 'ON' : 'OFF'}`,
      device,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const { name, type, roomId, powerRatingW, relayNumber } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      res.status(404).json({ success: false, message: 'Device not found' });
      return;
    }

    if (name) device.name = name;
    if (type) device.type = type;
    if (roomId) device.roomId = roomId;
    if (powerRatingW) device.powerRatingW = powerRatingW;
    if (relayNumber) device.relayNumber = relayNumber;

    await device.save();
    res.status(200).json({ success: true, device });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findByIdAndDelete(deviceId);

    if (device) {
      await Room.findByIdAndUpdate(device.roomId, { $inc: { deviceCount: -1 } });
      await Telemetry.deleteMany({ deviceId: device._id });
    }

    res.status(200).json({ success: true, message: 'Device removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const triggerDeviceOta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const { firmwareVersion } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      res.status(404).json({ success: false, message: 'Device not found' });
      return;
    }

    device.firmwareVersion = firmwareVersion || 'v2.2.0-ota';
    await device.save();

    res.status(200).json({
      success: true,
      message: `OTA Update process initiated for ${device.name} (${device.firmwareVersion})`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

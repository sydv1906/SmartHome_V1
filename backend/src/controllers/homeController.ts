import { Response } from 'express';
import Home from '../models/Home';
import Room from '../models/Room';
import Device from '../models/Device';
import Telemetry from '../models/Telemetry';
import { AuthRequest } from '../middleware/auth';

export const getHomes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homes = await Home.find({
      $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }],
    });
    res.status(200).json({ success: true, homes });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createHome = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, tariffPerKWh, currency } = req.body;
    const newHome = await Home.create({
      name,
      address,
      ownerId: req.user._id,
      members: [{ userId: req.user._id, role: 'Owner' }],
      tariffPerKWh: tariffPerKWh || 0.15,
      currency: currency || '$',
    });

    req.user.homes.push(newHome._id);
    req.user.activeHomeId = newHome._id;
    await req.user.save();

    res.status(201).json({ success: true, home: newHome });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setHomeMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { homeId } = req.params;
    const { mode } = req.body;

    const home = await Home.findById(homeId);
    if (!home) {
      res.status(404).json({ success: false, message: 'Home not found' });
      return;
    }

    home.currentMode = mode;
    await home.save();

    if (mode === 'Vacation Mode' || mode === 'Away Mode') {
      await Device.updateMany({ homeId }, { relayState: false });
    }

    res.status(200).json({ success: true, message: `Home mode changed to ${mode}`, home });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homeId = req.query.homeId || req.user?.activeHomeId || req.user?.homes?.[0];
    const devices = await Device.find(homeId ? { homeId } : {});

    let totalPowerW = 0;
    let connectedDevicesCount = devices.length;
    let runningDevicesCount = 0;
    let onlineDevicesCount = 0;
    let offlineDevicesCount = 0;
    let totalEnergyKWh = 0;
    let sumVoltage = 0;

    devices.forEach((dev) => {
      if (dev.relayState) {
        totalPowerW += dev.powerW;
        runningDevicesCount++;
      }
      totalEnergyKWh += dev.energyKWh;
      sumVoltage += dev.voltageV;
      if (dev.onlineStatus) onlineDevicesCount++;
      else offlineDevicesCount++;
    });

    const avgVoltageV = devices.length > 0 ? sumVoltage / devices.length : 230.0;
    const avgCurrentA = totalPowerW / (avgVoltageV * 0.98);

    const todayEnergyKWh = Number(totalEnergyKWh.toFixed(2));
    const monthlyEnergyKWh = Number((totalEnergyKWh * 30).toFixed(2));

    const homeObj = homeId ? await Home.findById(homeId) : null;
    const tariff = homeObj?.tariffPerKWh || 0.15;
    const currency = homeObj?.currency || '$';

    const estimatedBillCost = Number((monthlyEnergyKWh * tariff).toFixed(2));
    const todayCost = Number((todayEnergyKWh * tariff).toFixed(2));
    const carbonSavedKg = Number((todayEnergyKWh * 0.85).toFixed(2));

    res.status(200).json({
      success: true,
      stats: {
        totalPowerW: Math.round(totalPowerW),
        voltageV: Number(avgVoltageV.toFixed(1)),
        currentA: Number(avgCurrentA.toFixed(2)),
        todayEnergyKWh,
        monthlyEnergyKWh,
        estimatedBillCost,
        connectedDevicesCount,
        runningDevicesCount,
        onlineDevicesCount,
        offlineDevicesCount,
        todayCost,
        carbonSavedKg,
        powerFactor: 0.98,
        frequencyHz: 50.0,
        currency,
        currentMode: homeObj?.currentMode || 'Normal',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

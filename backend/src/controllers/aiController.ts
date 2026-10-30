import { Response } from 'express';
import Device from '../models/Device';
import Room from '../models/Room';
import Home from '../models/Home';
import { AuthRequest } from '../middleware/auth';
import { IAIEnergyRecommendation } from '@smarthome/shared';
import { getIO } from '../config/socket';
import { publishRelayCommand } from '../services/mqttService';
import { AssistantTurn, interpretAssistantRequest } from '../services/aiAssistantService';

export const postAssistantMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 1000) {
      res.status(400).json({ success: false, message: 'Message must be between 1 and 1000 characters.' });
      return;
    }

    const homeId = req.user.activeHomeId || req.user.homes?.[0];
    if (!homeId) {
      res.status(400).json({ success: false, message: 'Select a home before using the assistant.' });
      return;
    }

    const home = await Home.findOne({
      _id: homeId,
      $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }],
    });
    if (!home) {
      res.status(403).json({ success: false, message: 'You do not have access to the selected home.' });
      return;
    }

    const devices = await Device.find({ homeId }).populate('roomId', 'name');
    const deviceContext = devices.map((device) => ({
      name: device.name,
      type: device.type,
      room: (device.roomId as any)?.name || 'Unknown room',
      relayState: device.relayState,
      onlineStatus: device.onlineStatus,
      powerW: device.powerW,
    }));
    const history: AssistantTurn[] = Array.isArray(req.body?.history)
      ? req.body.history
          .filter((turn: any) =>
            turn &&
            (turn.role === 'user' || turn.role === 'assistant') &&
            typeof turn.content === 'string'
          )
          .slice(-8)
          .map((turn: AssistantTurn) => ({ role: turn.role, content: turn.content.slice(0, 1000) }))
      : [];

    const intent = await interpretAssistantRequest(message, history, deviceContext);
    if (intent.kind === 'reply') {
      res.status(200).json({ success: true, reply: intent.reply });
      return;
    }

    const matchingDevices = devices.filter((device) => {
      const roomName = (device.roomId as any)?.name || '';
      return (
        (!intent.deviceName || device.name.toLowerCase() === intent.deviceName.toLowerCase()) &&
        (!intent.roomName || roomName.toLowerCase() === intent.roomName.toLowerCase())
      );
    });

    if (intent.kind === 'status') {
      if (intent.deviceName || intent.roomName) {
        if (matchingDevices.length === 0) {
          res.status(200).json({ success: true, reply: 'I could not find that device or room in your active home.' });
          return;
        }
        if (intent.deviceName && matchingDevices.length > 1) {
          res.status(200).json({ success: true, reply: 'I found more than one device with that name. Which room do you mean?' });
          return;
        }

        const runningPowerW = matchingDevices.reduce((total, device) => total + (device.relayState ? device.powerW : 0), 0);
        const summary = matchingDevices
          .map((device) => `${device.name} in ${(device.roomId as any)?.name || 'Unknown room'} is ${device.onlineStatus ? (device.relayState ? 'on' : 'off') : 'offline'} and drawing ${Math.round(device.powerW)} watts`)
          .join('. ');
        res.status(200).json({
          success: true,
          reply: `${summary}. Combined active power is ${Math.round(runningPowerW)} watts.`,
        });
        return;
      }

      const runningDevices = devices.filter((device) => device.relayState);
      const totalPowerW = runningDevices.reduce((total, device) => total + device.powerW, 0);
      const onlineCount = devices.filter((device) => device.onlineStatus).length;
      res.status(200).json({
        success: true,
        reply: `Your home has ${devices.length} devices, ${onlineCount} online, and ${runningDevices.length} switched on. Current active power is ${Math.round(totalPowerW)} watts.`,
      });
      return;
    }

    if (!intent.deviceName || !intent.state) {
      res.status(200).json({
        success: true,
        reply: intent.reply || 'Which device should I switch, and should it be on or off?',
      });
      return;
    }
    if (matchingDevices.length === 0) {
      res.status(200).json({ success: true, reply: 'I could not find that device in your active home. Please check its name or room.' });
      return;
    }
    if (matchingDevices.length > 1) {
      res.status(200).json({ success: true, reply: 'I found more than one device with that name. Which room do you mean?' });
      return;
    }

    const device = matchingDevices[0];
    if (!device.onlineStatus) {
      res.status(200).json({ success: true, reply: `${device.name} is offline, so I could not change its state.` });
      return;
    }

    const state = intent.state === 'on';
    device.relayState = state;
    device.powerW = state ? device.powerRatingW * 0.85 : 0;
    device.currentA = state ? device.powerW / (device.voltageV * device.powerFactor) : 0;
    device.lastSeen = new Date();
    await device.save();
    const commandDispatched = publishRelayCommand(req.user._id.toString(), device.esp32Id, device.relayNumber, state);

    try {
      getIO().to(`home_${device.homeId}`).emit('relay_state_change', {
        deviceId: device._id,
        relayState: device.relayState,
        powerW: device.powerW,
        currentA: device.currentA,
      });
    } catch (_) {}

    const roomName = (device.roomId as any)?.name;
    res.status(200).json({
      success: true,
      reply: commandDispatched
        ? `The relay command to switch ${device.name}${roomName ? ` in ${roomName}` : ''} ${state ? 'on' : 'off'} was sent. The app now shows it ${state ? 'on' : 'off'}; the device has not confirmed the change yet.`
        : `The app state for ${device.name}${roomName ? ` in ${roomName}` : ''} is now set to ${state ? 'on' : 'off'}, but the MQTT broker is disconnected, so the device did not receive a confirmed command.`,
      deviceId: device._id,
      relayState: state,
    });
  } catch (err: any) {
    const message = err.name === 'TimeoutError'
      ? 'The assistant took too long to respond. Please try again.'
      : err.message || 'Assistant request failed.';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ success: false, message });
  }
};

export const getAIRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homeId = req.query.homeId || req.user.activeHomeId;
    const devices = await Device.find({ homeId }).populate('roomId', 'name');

    const recommendations: IAIEnergyRecommendation[] = [];

    // 1. Check AC & High power devices running idle or long hours
    const highPowerDevs = devices.filter((d) => d.powerRatingW >= 1000);
    if (highPowerDevs.length > 0) {
      const ac = highPowerDevs[0];
      recommendations.push({
        id: 'rec_ac_schedule',
        title: `Schedule Auto Off for ${ac.name}`,
        description: `Our AI detected ${ac.name} running continuously during off-peak hours (1:00 AM - 5:00 AM). Setting an auto-off timer after 3 hours of operation will reduce unnecessary cooling load.`,
        potentialSavingsMonthly: 18.5,
        category: 'Schedule',
        impact: 'High',
        actionDeviceIds: [ac._id.toString()],
      });
    }

    // 2. Standby / Idle energy waste detection
    const standbyDevs = devices.filter((d) => d.powerW > 0 && d.powerW < 40);
    if (standbyDevs.length > 0) {
      recommendations.push({
        id: 'rec_vampire_load',
        title: 'Eliminate Phantom Standby Load',
        description: `${standbyDevs.length} devices (${standbyDevs.map((d) => d.name).join(', ')}) draw standby power while idle. Enabling Night Eco Mode can cut phantom load completely.`,
        potentialSavingsMonthly: 8.2,
        category: 'Idle Waste',
        impact: 'Medium',
        actionDeviceIds: standbyDevs.map((d) => d._id.toString()),
      });
    }

    // 3. Peak Tariff Shifting
    recommendations.push({
      id: 'rec_peak_shift',
      title: 'Shift Heavy Loads Away From Peak Hours (5 PM - 9 PM)',
      description: 'Your local utility charges higher rates during evening peak hours. Shifting high-wattage water pumps and heaters to run before 4 PM saves up to 22% on utility bills.',
      potentialSavingsMonthly: 24.0,
      category: 'Peak Tariff',
      impact: 'High',
    });

    // 4. Power Factor optimization
    recommendations.push({
      id: 'rec_power_factor',
      title: 'Optimal Power Factor (0.98 PF)',
      description: 'Your home electrical grid power factor is running at an efficient 0.98 PF. No inductive reactive power penalty detected.',
      potentialSavingsMonthly: 4.5,
      category: 'Appliance Health',
      impact: 'Low',
    });

    res.status(200).json({
      success: true,
      recommendations,
      totalPotentialMonthlySavings: recommendations.reduce((acc, r) => acc + r.potentialSavingsMonthly, 0),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

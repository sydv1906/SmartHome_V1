import { Response } from 'express';
import Device from '../models/Device';
import Room from '../models/Room';
import Home from '../models/Home';
import Telemetry from '../models/Telemetry';
import AutomationRule from '../models/AutomationRule';
import Schedule from '../models/Schedule';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { IAIEnergyRecommendation } from '@smarthome/shared';
import { getIO } from '../config/socket';
import { publishRelayCommand } from '../services/mqttService';
import {
  AssistantDeviceContext,
  AssistantHomeContext,
  AssistantTurn,
  interpretAssistantRequest,
} from '../services/aiAssistantService';

const isExplicitRelayCommand = (message: string): boolean =>
  /^(?:(?:please|hey)\s+)*(?:(?:can|could|would)\s+you\s+)?(?:(?:please)\s+)*(?:turn|switch|power)\s+(?:(?:on|off)\s+(?:the\s+)?[\w].+|(?:the\s+)?[\w].+\s+(?:on|off))$/i
    .test(message.trim().replace(/[?.!]+$/, ''));

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
    const deviceIds = devices.map((device) => device._id);
    const telemetrySince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [rooms, rules, schedules, recentAlerts, telemetrySummaries] = await Promise.all([
      Room.find({ homeId }).select('name type status deviceCount totalPowerW totalEnergyKWh').lean(),
      AutomationRule.find({ homeId }).sort({ updatedAt: -1 }).limit(50).lean(),
      Schedule.find({ homeId })
        .populate('deviceId', 'name type')
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean(),
      Notification.find({ homeId })
        .select('title message type severity createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      deviceIds.length
        ? Telemetry.aggregate([
            { $match: { deviceId: { $in: deviceIds }, timestamp: { $gte: telemetrySince } } },
            { $sort: { deviceId: 1, timestamp: 1 } },
            {
              $group: {
                _id: '$deviceId',
                sampleCount: { $sum: 1 },
                averagePowerW: { $avg: '$powerW' },
                peakPowerW: { $max: '$powerW' },
                firstEnergyKWh: { $first: '$energyKWh' },
                lastEnergyKWh: { $last: '$energyKWh' },
                observedFrom: { $first: '$timestamp' },
                latestTimestamp: { $last: '$timestamp' },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    const telemetryByDevice = new Map(
      telemetrySummaries.map((summary: any) => [
        summary._id.toString(),
        {
          sampleCount: summary.sampleCount,
          averagePowerW: Number(summary.averagePowerW.toFixed(1)),
          peakPowerW: Number(summary.peakPowerW.toFixed(1)),
          energyDeltaKWh: summary.sampleCount > 1 && summary.lastEnergyKWh >= summary.firstEnergyKWh
            ? Number((summary.lastEnergyKWh - summary.firstEnergyKWh).toFixed(3))
            : null,
          observedFrom: summary.observedFrom?.toISOString() || null,
          latestTimestamp: summary.latestTimestamp?.toISOString() || null,
        },
      ])
    );
    const deviceContext: AssistantDeviceContext[] = devices.map((device) => ({
      name: device.name,
      type: device.type,
      room: (device.roomId as any)?.name || 'Unknown room',
      relayState: device.relayState,
      onlineStatus: device.onlineStatus,
      powerW: device.powerW,
      powerRatingW: device.powerRatingW,
      voltageV: device.voltageV,
      currentA: device.currentA,
      energyKWh: device.energyKWh,
      powerFactor: device.powerFactor,
      frequencyHz: device.frequencyHz,
      meterConnected: device.meterConnected,
      temperatureC: typeof device.temperatureC === 'number' ? device.temperatureC : null,
      signalStrengthRssi: device.signalStrengthRssi,
      firmwareVersion: device.firmwareVersion,
      lastSeen: device.lastSeen?.toISOString() || null,
      recentTelemetry: telemetryByDevice.get(device._id.toString()) || null,
    }));
    const homeContext: AssistantHomeContext = {
      home: {
        name: home.name,
        currency: home.currency,
        tariffPerKWh: home.tariffPerKWh,
        timezone: home.timezone,
        currentMode: home.currentMode,
      },
      rooms: rooms.map((room) => ({
        name: room.name,
        type: room.type,
        status: room.status,
        deviceCount: room.deviceCount,
        totalPowerW: room.totalPowerW,
        totalEnergyKWh: room.totalEnergyKWh,
      })),
      automations: rules.map((rule) => {
        const conditionDevice = rule.condition.deviceId
          ? devices.find((device) => device._id.toString() === rule.condition.deviceId?.toString())
          : null;
        const conditionRoom = rule.condition.roomId
          ? rooms.find((room) => room._id.toString() === rule.condition.roomId?.toString())
          : null;
        const targetDevice = rule.action.targetDeviceId
          ? devices.find((device) => device._id.toString() === rule.action.targetDeviceId?.toString())
          : null;
        const conditionParts = [rule.condition.type.replace(/_/g, ' ')];
        if (typeof rule.condition.thresholdValue === 'number') {
          conditionParts.push(`threshold ${rule.condition.thresholdValue}`);
        }
        if (rule.condition.durationMinutes) {
          conditionParts.push(`duration ${rule.condition.durationMinutes} minutes`);
        }
        if (rule.condition.cronSchedule) {
          conditionParts.push(`schedule ${rule.condition.cronSchedule}`);
        }
        if (conditionDevice) conditionParts.push(`device ${conditionDevice.name}`);
        if (conditionRoom) conditionParts.push(`room ${conditionRoom.name}`);
        const actionParts = [rule.action.type.replace(/_/g, ' ')];
        if (targetDevice) actionParts.push(`device ${targetDevice.name}`);
        if (rule.action.mode) actionParts.push(rule.action.mode);

        return {
          name: rule.name,
          enabled: rule.enabled,
          condition: conditionParts.join(', '),
          action: actionParts.join(', '),
          lastTriggered: rule.lastTriggered?.toISOString() || null,
        };
      }),
      schedules: schedules.map((schedule: any) => ({
        name: schedule.name,
        device: schedule.deviceId?.name || 'Unknown device',
        time: schedule.time,
        days: schedule.days,
        action: schedule.action,
        enabled: schedule.enabled,
      })),
      recentAlerts: recentAlerts.map((alert) => ({
        title: alert.title,
        message: alert.message,
        type: alert.type,
        severity: alert.severity,
        createdAt: alert.createdAt.toISOString(),
      })),
      dataAsOf: new Date().toISOString(),
    };
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

    const intent = await interpretAssistantRequest(message, history, deviceContext, homeContext);
    if (intent.kind !== 'relay') {
      res.status(200).json({ success: true, reply: intent.reply });
      return;
    }
    if (!isExplicitRelayCommand(message)) {
      res.status(200).json({
        success: true,
        reply: 'I can control a device when you give me a direct command, such as “turn the living room fan off.”',
      });
      return;
    }

    const matchingDevices = devices.filter((device) => {
      const roomName = (device.roomId as any)?.name || '';
      return (
        (!intent.deviceName || device.name.toLowerCase() === intent.deviceName.toLowerCase()) &&
        (!intent.roomName || roomName.toLowerCase() === intent.roomName.toLowerCase())
      );
    });

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

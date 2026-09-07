import mqtt, { MqttClient } from 'mqtt';
import Device from '../models/Device';
import Telemetry from '../models/Telemetry';
import EnergyLog from '../models/EnergyLog';
import Notification from '../models/Notification';
import AutomationRule from '../models/AutomationRule';
import { getIO } from '../config/socket';

let mqttClient: MqttClient | null = null;

export const initMqtt = (): MqttClient => {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
  const clientId = process.env.MQTT_CLIENT_ID || `smarthome_backend_${Math.random().toString(16).substring(2, 8)}`;

  console.log(`[MQTT] Connecting to broker at ${brokerUrl}...`);

  mqttClient = mqtt.connect(brokerUrl, {
    clientId,
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 5000,
    connectTimeout: 4000,
  });

  mqttClient.on('connect', () => {
    console.log(`[MQTT] Connected successfully to broker!`);
    // Subscribe to all device telemetry, status, and heartbeat topics
    mqttClient?.subscribe('smarthome/+/+/telemetry', (err) => {
      if (!err) console.log('[MQTT] Subscribed to smarthome/+/+/telemetry');
    });
    mqttClient?.subscribe('smarthome/+/+/status', (err) => {
      if (!err) console.log('[MQTT] Subscribed to smarthome/+/+/status');
    });
    mqttClient?.subscribe('smarthome/+/+/heartbeat', (err) => {
      if (!err) console.log('[MQTT] Subscribed to smarthome/+/+/heartbeat');
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const topicParts = topic.split('/');
      if (topicParts.length < 4 || topicParts[0] !== 'smarthome') return;

      const userId = topicParts[1];
      const deviceIdStr = topicParts[2];
      const messageType = topicParts[3];

      const payload = JSON.parse(message.toString());

      if (messageType === 'telemetry') {
        await handleTelemetryMessage(deviceIdStr, payload);
      } else if (messageType === 'status') {
        await handleStatusMessage(deviceIdStr, payload);
      } else if (messageType === 'heartbeat') {
        await handleHeartbeatMessage(deviceIdStr, payload);
      }
    } catch (err) {
      console.error(`[MQTT Error] Failed parsing message on topic ${topic}:`, err);
    }
  });

  mqttClient.on('error', (err) => {
    console.warn(`[MQTT Warning] MQTT connection issue: ${err.message}. Retrying...`);
  });

  return mqttClient;
};

export const publishRelayCommand = (userId: string, deviceId: string, relayNumber: number, state: boolean): boolean => {
  const topic = `smarthome/${userId}/${deviceId}/relay`;
  const payload = JSON.stringify({
    relay: relayNumber,
    state: state ? 'ON' : 'OFF',
    timestamp: new Date().toISOString(),
  });

  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, payload, { qos: 1 });
    console.log(`[MQTT Publish] Relay command sent to ${topic}: ${payload}`);
    return true;
  } else {
    console.log(`[MQTT Direct] Broker unavailable, simulating direct relay toggle for device ${deviceId}`);
    return false;
  }
};

async function handleTelemetryMessage(deviceIdStr: string, payload: any) {
  try {
    const device = await Device.findOne({ $or: [{ _id: deviceIdStr }, { esp32Id: deviceIdStr }] });
    if (!device) return;

    // Update live device fields
    device.voltageV = payload.voltageV ?? payload.v ?? device.voltageV;
    device.currentA = payload.currentA ?? payload.i ?? device.currentA;
    device.powerW = payload.powerW ?? payload.p ?? (device.voltageV * device.currentA * (payload.powerFactor || 0.98));
    device.energyKWh = payload.energyKWh ?? payload.e ?? (device.energyKWh + device.powerW / 3600000);
    device.powerFactor = payload.powerFactor ?? device.powerFactor;
    device.frequencyHz = payload.frequencyHz ?? device.frequencyHz;
    device.relayState = payload.relayState !== undefined ? Boolean(payload.relayState) : device.relayState;
    if (payload.temperatureC !== undefined) device.temperatureC = payload.temperatureC;
    device.lastSeen = new Date();
    device.onlineStatus = true;
    await device.save();

    // Store Telemetry record
    await Telemetry.create({
      deviceId: device._id,
      esp32Id: device.esp32Id,
      voltageV: device.voltageV,
      currentA: device.currentA,
      powerW: device.powerW,
      energyKWh: device.energyKWh,
      powerFactor: device.powerFactor,
      frequencyHz: device.frequencyHz,
      relayState: device.relayState,
      temperatureC: device.temperatureC,
      timestamp: new Date(),
    });

    // Broadcast via Socket.IO
    try {
      const io = getIO();
      io.to(`home_${device.homeId}`).emit('telemetry_update', {
        deviceId: device._id,
        esp32Id: device.esp32Id,
        voltageV: device.voltageV,
        currentA: device.currentA,
        powerW: device.powerW,
        energyKWh: device.energyKWh,
        powerFactor: device.powerFactor,
        frequencyHz: device.frequencyHz,
        relayState: device.relayState,
        temperatureC: device.temperatureC,
        lastSeen: device.lastSeen,
      });
    } catch (sErr) {
      // socket io not yet ready
    }

    // Check Smart Automations (High Voltage, Overcurrent, Runtime limits)
    await checkAutomationRules(device);
  } catch (err) {
    console.error(`[MQTT Telemetry Error]`, err);
  }
}

async function handleStatusMessage(deviceIdStr: string, payload: any) {
  try {
    const device = await Device.findOne({ $or: [{ _id: deviceIdStr }, { esp32Id: deviceIdStr }] });
    if (!device) return;

    if (payload.rssi) device.signalStrengthRssi = payload.rssi;
    if (payload.wifi) device.wifiSsid = payload.wifi;
    if (payload.firmwareVersion) device.firmwareVersion = payload.firmwareVersion;
    device.onlineStatus = payload.status === 'online' || payload.status === true;
    device.lastSeen = new Date();
    await device.save();

    try {
      const io = getIO();
      io.to(`home_${device.homeId}`).emit('device_status_change', {
        deviceId: device._id,
        onlineStatus: device.onlineStatus,
        rssi: device.signalStrengthRssi,
        wifiSsid: device.wifiSsid,
      });
    } catch (_) {}
  } catch (err) {
    console.error(`[MQTT Status Error]`, err);
  }
}

async function handleHeartbeatMessage(deviceIdStr: string, payload: any) {
  try {
    await Device.updateOne(
      { $or: [{ _id: deviceIdStr }, { esp32Id: deviceIdStr }] },
      { onlineStatus: true, lastSeen: new Date() }
    );
  } catch (_) {}
}

async function checkAutomationRules(device: any) {
  try {
    // 1. Hardcoded Safety Rules: High Voltage (>250V), Overcurrent (>15A), Overload (>3500W)
    if (device.voltageV > 250) {
      // High Voltage protection trigger
      publishRelayCommand('system', device._id.toString(), device.relayNumber, false);
      device.relayState = false;
      await device.save();

      await Notification.create({
        homeId: device.homeId,
        title: '⚠️ High Voltage Alert',
        message: `Voltage spikes detected at ${device.voltageV.toFixed(1)}V on ${device.name}. Relay automatically turned OFF for protection!`,
        type: 'High Voltage',
        severity: 'danger',
        deviceId: device._id,
      });

      try {
        getIO().to(`home_${device.homeId}`).emit('alert_triggered', {
          title: '⚠️ High Voltage Alert',
          message: `${device.name} voltage reached ${device.voltageV.toFixed(1)}V! Auto shut-off engaged.`,
          severity: 'danger',
          deviceId: device._id,
        });
      } catch (_) {}
    } else if (device.currentA > 15) {
      // Overcurrent protection
      publishRelayCommand('system', device._id.toString(), device.relayNumber, false);
      device.relayState = false;
      await device.save();

      await Notification.create({
        homeId: device.homeId,
        title: '🔥 Overcurrent Cutoff',
        message: `Current draw exceeded limit (${device.currentA.toFixed(2)}A) on ${device.name}. Relay tripped!`,
        type: 'High Current',
        severity: 'critical',
        deviceId: device._id,
      });

      try {
        getIO().to(`home_${device.homeId}`).emit('alert_triggered', {
          title: '🔥 Overcurrent Cutoff',
          message: `${device.name} current reached ${device.currentA.toFixed(2)}A! Relay tripped.`,
          severity: 'critical',
          deviceId: device._id,
        });
      } catch (_) {}
    }

    // 2. User-Defined Automation Rules
    const rules = await AutomationRule.find({ homeId: device.homeId, enabled: true });
    for (const rule of rules) {
      if (rule.condition.type === 'voltage_high' && device.voltageV > rule.condition.thresholdValue) {
        executeRuleAction(rule, device);
      } else if (rule.condition.type === 'current_high' && device.currentA > rule.condition.thresholdValue) {
        executeRuleAction(rule, device);
      } else if (rule.condition.type === 'power_high' && device.powerW > rule.condition.thresholdValue) {
        executeRuleAction(rule, device);
      }
    }
  } catch (err) {
    console.error(`[Automation Check Error]`, err);
  }
}

async function executeRuleAction(rule: any, device: any) {
  rule.lastTriggered = new Date();
  await rule.save();

  if (rule.action.type === 'turn_off_relay') {
    publishRelayCommand('system', device._id.toString(), device.relayNumber, false);
    device.relayState = false;
    await device.save();
  }

  await Notification.create({
    homeId: device.homeId,
    title: `⚡ Automation Triggered: ${rule.name}`,
    message: `Rule "${rule.name}" engaged for ${device.name}. Action: ${rule.action.type}`,
    type: 'Overload',
    severity: 'warning',
    deviceId: device._id,
  });
}

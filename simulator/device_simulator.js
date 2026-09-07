/**
 * ESP32 Smart Home IoT Device Simulator
 * Simulates real hardware ESP32 microcontrollers with PZEM-004T energy sensors
 * and 4-channel Relay modules publishing real-time telemetry over MQTT.
 */

const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
console.log(`[IoT Simulator] Starting ESP32 Device Cluster connecting to ${BROKER_URL}...`);

const simulatedDevices = [
  { esp32Id: 'esp32_lr_fan_01', name: 'Living Room Fan', powerRatingW: 75, voltageV: 230.0, relayState: true, currentA: 0.32, energyKWh: 1.4 },
  { esp32Id: 'esp32_br_ac_01', name: 'Master Bedroom AC', powerRatingW: 1500, voltageV: 230.0, relayState: true, currentA: 6.65, energyKWh: 12.8 },
  { esp32Id: 'esp32_kt_cook_01', name: 'Induction Cooktop', powerRatingW: 2000, voltageV: 230.0, relayState: false, currentA: 0, energyKWh: 4.2 },
  { esp32Id: 'esp32_of_pc_01', name: 'Developer Workstation', powerRatingW: 450, voltageV: 230.0, relayState: true, currentA: 1.95, energyKWh: 6.5 },
  { esp32Id: 'esp32_lab_3d_01', name: '3D Printer Rig', powerRatingW: 300, voltageV: 230.0, relayState: true, currentA: 1.30, energyKWh: 3.1 },
];

const client = mqtt.connect(BROKER_URL, {
  clientId: `esp32_simulator_${Math.random().toString(16).substring(2, 8)}`,
  reconnectPeriod: 3000,
});

client.on('connect', () => {
  console.log(`[IoT Simulator] Connected to MQTT Broker! Registered ${simulatedDevices.length} simulated ESP32 devices.`);

  simulatedDevices.forEach((dev) => {
    const relayTopic = `smarthome/+/+/relay`;
    client.subscribe(relayTopic);
  });

  simulatedDevices.forEach((dev) => {
    const statusTopic = `smarthome/system/${dev.esp32Id}/status`;
    client.publish(
      statusTopic,
      JSON.stringify({
        status: 'online',
        rssi: -62,
        wifi: 'SmartHome_WiFi_5G',
        firmwareVersion: 'v2.1.0',
        hardware: 'ESP32-WROOM-32U',
      })
    );
  });

  setInterval(publishTelemetryLoop, 2000);
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const topicParts = topic.split('/');
    const targetEspId = topicParts[2];

    const device = simulatedDevices.find((d) => d.esp32Id === targetEspId);
    if (device) {
      device.relayState = payload.state === 'ON' || payload.state === true;
      if (device.relayState) {
        device.currentA = Number((device.powerRatingW / (device.voltageV * 0.98)).toFixed(2));
      } else {
        device.currentA = 0;
      }
      console.log(`[IoT Hardware Relay] Device ${device.name} (${device.esp32Id}) Relay switched to ${device.relayState ? 'ON [CLOSED]' : 'OFF [OPEN]'}`);
    }
  } catch (e) {
    console.error(`[Simulator Error] Failed processing command:`, e);
  }
});

function publishTelemetryLoop() {
  simulatedDevices.forEach((dev) => {
    dev.voltageV = 230.0;
    const powerW = dev.relayState ? dev.powerRatingW : 0;
    dev.currentA = dev.relayState ? Number((powerW / (dev.voltageV * 0.98)).toFixed(2)) : 0;
    dev.energyKWh += (powerW * 2) / 3600000;

    const telemetryTopic = `smarthome/system/${dev.esp32Id}/telemetry`;
    const telemetryPayload = {
      esp32Id: dev.esp32Id,
      voltageV: dev.voltageV,
      currentA: dev.currentA,
      powerW: powerW,
      energyKWh: Number(dev.energyKWh.toFixed(4)),
      powerFactor: 0.98,
      frequencyHz: 50.0,
      relayState: dev.relayState,
      temperatureC: 28.0,
      timestamp: new Date().toISOString(),
    };

    client.publish(telemetryTopic, JSON.stringify(telemetryPayload));
  });
}

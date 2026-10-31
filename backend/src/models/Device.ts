import { Schema, model, Document } from 'mongoose';

export interface IDeviceDocument extends Document {
  name: string;
  type:
    | 'Fan'
    | 'Light'
    | 'Socket'
    | 'TV'
    | 'Air Conditioner'
    | 'Cooler'
    | 'Heater'
    | 'Motor'
    | 'Computer'
    | 'Printer'
    | 'Router'
    | 'Pump'
    | 'Custom Device';
  roomId: Schema.Types.ObjectId;
  homeId: Schema.Types.ObjectId;
  esp32Id: string;
  relayNumber: number;
  mqttTopics: {
    telemetry: string;
    relay: string;
    status: string;
    ota: string;
    heartbeat: string;
  };
  powerRatingW: number;
  meterConnected: boolean;
  currentA: number;
  voltageV: number;
  powerW: number;
  energyKWh: number;
  powerFactor: number;
  frequencyHz: number;
  relayState: boolean;
  onlineStatus: boolean;
  signalStrengthRssi: number;
  wifiSsid?: string;
  firmwareVersion: string;
  temperatureC?: number;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDeviceDocument>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'Fan',
        'Light',
        'Socket',
        'TV',
        'Air Conditioner',
        'Cooler',
        'Heater',
        'Motor',
        'Computer',
        'Printer',
        'Router',
        'Pump',
        'Custom Device',
      ],
      required: true,
    },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    homeId: { type: Schema.Types.ObjectId, ref: 'Home', required: true },
    esp32Id: { type: String, required: true, index: true },
    relayNumber: { type: Number, required: true, min: 1, max: 16 },
    mqttTopics: {
      telemetry: { type: String, required: true },
      relay: { type: String, required: true },
      status: { type: String, required: true },
      ota: { type: String, required: true },
      heartbeat: { type: String, required: true },
    },
    powerRatingW: { type: Number, default: 100 },
    meterConnected: { type: Boolean, default: true },
    currentA: { type: Number, default: 0 },
    voltageV: { type: Number, default: 230 },
    powerW: { type: Number, default: 0 },
    energyKWh: { type: Number, default: 0 },
    powerFactor: { type: Number, default: 0.98 },
    frequencyHz: { type: Number, default: 50.0 },
    relayState: { type: Boolean, default: false },
    onlineStatus: { type: Boolean, default: true },
    signalStrengthRssi: { type: Number, default: -65 },
    wifiSsid: { type: String, default: 'SmartHome_WiFi_5G' },
    firmwareVersion: { type: String, default: 'v2.1.0' },
    temperatureC: { type: Number, default: 28 },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<IDeviceDocument>('Device', DeviceSchema);

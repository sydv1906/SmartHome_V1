import { Schema, model, Document } from 'mongoose';

export interface ITelemetryDocument extends Document {
  deviceId: Schema.Types.ObjectId;
  esp32Id: string;
  voltageV: number;
  currentA: number;
  powerW: number;
  energyKWh: number;
  powerFactor: number;
  frequencyHz: number;
  relayState: boolean;
  temperatureC?: number;
  timestamp: Date;
}

const TelemetrySchema = new Schema<ITelemetryDocument>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    esp32Id: { type: String, required: true, index: true },
    voltageV: { type: Number, required: true },
    currentA: { type: Number, required: true },
    powerW: { type: Number, required: true },
    energyKWh: { type: Number, required: true },
    powerFactor: { type: Number, default: 0.98 },
    frequencyHz: { type: Number, default: 50.0 },
    relayState: { type: Boolean, required: true },
    temperatureC: { type: Number },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

TelemetrySchema.index({ deviceId: 1, timestamp: -1 });

export default model<ITelemetryDocument>('Telemetry', TelemetrySchema);

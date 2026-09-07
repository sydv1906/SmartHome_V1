import { Schema, model, Document } from 'mongoose';

export interface IEnergyLogDocument extends Document {
  deviceId: Schema.Types.ObjectId;
  homeId: Schema.Types.ObjectId;
  roomId: Schema.Types.ObjectId;
  date: string; // YYYY-MM-DD
  hour?: number;
  energyKWh: number;
  cost: number;
  peakPowerW: number;
  avgVoltageV: number;
  avgPowerFactor: number;
  carbonOffsetKg: number;
  createdAt: Date;
  updatedAt: Date;
}

const EnergyLogSchema = new Schema<IEnergyLogDocument>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    homeId: { type: Schema.Types.ObjectId, ref: 'Home', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: String, required: true, index: true },
    hour: { type: Number, min: 0, max: 23 },
    energyKWh: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    peakPowerW: { type: Number, default: 0 },
    avgVoltageV: { type: Number, default: 230 },
    avgPowerFactor: { type: Number, default: 0.98 },
    carbonOffsetKg: { type: Number, default: 0 },
  },
  { timestamps: true }
);

EnergyLogSchema.index({ homeId: 1, date: 1 });
EnergyLogSchema.index({ deviceId: 1, date: 1 });

export default model<IEnergyLogDocument>('EnergyLog', EnergyLogSchema);

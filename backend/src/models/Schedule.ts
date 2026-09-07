import { Schema, model, Document } from 'mongoose';

export interface IScheduleDocument extends Document {
  deviceId: Schema.Types.ObjectId;
  homeId: Schema.Types.ObjectId;
  name: string;
  time: string; // HH:mm
  days: number[]; // 0=Sun, 1=Mon...
  action: 'ON' | 'OFF';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<IScheduleDocument>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    homeId: { type: Schema.Types.ObjectId, ref: 'Home', required: true },
    name: { type: String, required: true },
    time: { type: String, required: true },
    days: [{ type: Number, min: 0, max: 6 }],
    action: { type: String, enum: ['ON', 'OFF'], required: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IScheduleDocument>('Schedule', ScheduleSchema);

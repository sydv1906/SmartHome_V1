import { Schema, model, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  homeId: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  title: string;
  message: string;
  type:
    | 'High Voltage'
    | 'Low Voltage'
    | 'High Current'
    | 'Relay Failure'
    | 'Device Offline'
    | 'ESP32 Offline'
    | 'Power Failure'
    | 'Power Restored'
    | 'Fire Risk'
    | 'Overload';
  severity: 'info' | 'warning' | 'danger' | 'critical';
  deviceId?: Schema.Types.ObjectId;
  read: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    homeId: { type: Schema.Types.ObjectId, ref: 'Home', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'High Voltage',
        'Low Voltage',
        'High Current',
        'Relay Failure',
        'Device Offline',
        'ESP32 Offline',
        'Power Failure',
        'Power Restored',
        'Fire Risk',
        'Overload',
      ],
      required: true,
    },
    severity: { type: String, enum: ['info', 'warning', 'danger', 'critical'], default: 'warning' },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
    read: { type: Boolean, default: false },
    channels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default model<INotificationDocument>('Notification', NotificationSchema);

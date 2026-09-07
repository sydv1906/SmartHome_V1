import { Schema, model, Document } from 'mongoose';

export interface IAutomationRuleDocument extends Document {
  homeId: Schema.Types.ObjectId;
  name: string;
  enabled: boolean;
  condition: {
    type: 'voltage_high' | 'voltage_low' | 'current_high' | 'power_high' | 'duration_exceeded' | 'schedule';
    thresholdValue: number;
    deviceId?: Schema.Types.ObjectId;
    roomId?: Schema.Types.ObjectId;
    durationMinutes?: number;
    cronSchedule?: string;
  };
  action: {
    type: 'turn_off_relay' | 'turn_on_relay' | 'send_alert' | 'activate_mode';
    targetDeviceId?: Schema.Types.ObjectId;
    mode?: 'Night Mode' | 'Vacation Mode' | 'Away Mode' | 'Eco Saver';
  };
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AutomationRuleSchema = new Schema<IAutomationRuleDocument>(
  {
    homeId: { type: Schema.Types.ObjectId, ref: 'Home', required: true, index: true },
    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
    condition: {
      type: {
        type: String,
        enum: ['voltage_high', 'voltage_low', 'current_high', 'power_high', 'duration_exceeded', 'schedule'],
        required: true,
      },
      thresholdValue: { type: Number, required: true },
      deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
      roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
      durationMinutes: { type: Number },
      cronSchedule: { type: String },
    },
    action: {
      type: {
        type: String,
        enum: ['turn_off_relay', 'turn_on_relay', 'send_alert', 'activate_mode'],
        required: true,
      },
      targetDeviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
      mode: { type: String, enum: ['Night Mode', 'Vacation Mode', 'Away Mode', 'Eco Saver'] },
    },
    lastTriggered: { type: Date },
  },
  { timestamps: true }
);

export default model<IAutomationRuleDocument>('AutomationRule', AutomationRuleSchema);

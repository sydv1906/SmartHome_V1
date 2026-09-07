import { Schema, model, Document } from 'mongoose';

export interface IRoomDocument extends Document {
  name: string;
  type:
    | 'Living Room'
    | 'Bedroom'
    | 'Kitchen'
    | 'Office'
    | 'Laboratory'
    | 'Garage'
    | 'Hall'
    | 'Classroom'
    | 'Hostel'
    | 'Custom Room';
  homeId: Schema.Types.ObjectId;
  imageUrl?: string;
  icon?: string;
  deviceCount: number;
  totalPowerW: number;
  totalEnergyKWh: number;
  status: 'active' | 'warning' | 'idle' | 'offline';
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoomDocument>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'Living Room',
        'Bedroom',
        'Kitchen',
        'Office',
        'Laboratory',
        'Garage',
        'Hall',
        'Classroom',
        'Hostel',
        'Custom Room',
      ],
      required: true,
    },
    homeId: { type: Schema.Types.ObjectId, ref: 'Home', required: true },
    imageUrl: { type: String },
    icon: { type: String, default: 'Home' },
    deviceCount: { type: Number, default: 0 },
    totalPowerW: { type: Number, default: 0 },
    totalEnergyKWh: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'warning', 'idle', 'offline'], default: 'idle' },
  },
  { timestamps: true }
);

export default model<IRoomDocument>('Room', RoomSchema);

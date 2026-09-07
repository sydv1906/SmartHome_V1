import { Schema, model, Document } from 'mongoose';

export interface IHomeDocument extends Document {
  name: string;
  address: string;
  ownerId: Schema.Types.ObjectId;
  members: { userId: Schema.Types.ObjectId; role: 'Owner' | 'Family Member' | 'Guest' }[];
  tariffPerKWh: number;
  currency: string;
  timezone: string;
  currentMode: 'Normal' | 'Night Mode' | 'Vacation Mode' | 'Away Mode' | 'Eco Saver';
  createdAt: Date;
  updatedAt: Date;
}

const HomeSchema = new Schema<IHomeDocument>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['Owner', 'Family Member', 'Guest'], default: 'Family Member' },
      },
    ],
    tariffPerKWh: { type: Number, default: 0.15 },
    currency: { type: String, default: '$' },
    timezone: { type: String, default: 'UTC' },
    currentMode: {
      type: String,
      enum: ['Normal', 'Night Mode', 'Vacation Mode', 'Away Mode', 'Eco Saver'],
      default: 'Normal',
    },
  },
  { timestamps: true }
);

export default model<IHomeDocument>('Home', HomeSchema);

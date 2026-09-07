import { Schema, model, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Owner' | 'Family Member' | 'Guest';
  avatar?: string;
  homeAddress?: string;
  phone?: string;
  homes: Schema.Types.ObjectId[];
  activeHomeId?: Schema.Types.ObjectId;
  isEmailVerified: boolean;
  preferences: {
    darkMode: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    theme: 'tesla-dark' | 'neon-blue' | 'cyber-emerald' | 'minimal-light';
    language: string;
    timezone: string;
    currency: string;
  };
  apiTokens: { name: string; token: string; createdAt: Date }[];
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Owner', 'Family Member', 'Guest'],
      default: 'Owner',
    },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    homeAddress: { type: String, default: '123 Smart Innovation Ave, Silicon Valley, CA' },
    phone: { type: String, default: '+1 (555) 019-2834' },
    homes: [{ type: Schema.Types.ObjectId, ref: 'Home' }],
    activeHomeId: { type: Schema.Types.ObjectId, ref: 'Home' },
    isEmailVerified: { type: Boolean, default: true },
    preferences: {
      darkMode: { type: Boolean, default: true },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      theme: { type: String, default: 'tesla-dark' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      currency: { type: String, default: '$' },
    },
    apiTokens: [
      {
        name: { type: String, required: true },
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export default model<IUserDocument>('User', UserSchema);

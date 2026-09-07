import { Schema, model, Document } from 'mongoose';

export interface IFirmwareDocument extends Document {
  version: string;
  deviceType: string;
  filename: string;
  fileSizeMb: number;
  releaseNotes: string;
  downloadUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const FirmwareSchema = new Schema<IFirmwareDocument>(
  {
    version: { type: String, required: true, unique: true },
    deviceType: { type: String, required: true, default: 'ESP32_PZEM004T' },
    filename: { type: String, required: true },
    fileSizeMb: { type: Number, required: true },
    releaseNotes: { type: String, required: true },
    downloadUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IFirmwareDocument>('Firmware', FirmwareSchema);

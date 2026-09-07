import { Response } from 'express';
import Firmware from '../models/Firmware';
import { AuthRequest } from '../middleware/auth';

export const getFirmwareList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const firmwares = await Firmware.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, firmwares });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createFirmware = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { version, deviceType, filename, fileSizeMb, releaseNotes, downloadUrl } = req.body;
    const firmware = await Firmware.create({
      version,
      deviceType: deviceType || 'ESP32_PZEM004T',
      filename,
      fileSizeMb: fileSizeMb || 1.4,
      releaseNotes,
      downloadUrl: downloadUrl || `https://cdn.smarthome.ai/firmware/${filename}`,
    });

    res.status(201).json({ success: true, firmware });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

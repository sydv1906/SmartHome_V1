import { Response } from 'express';
import Room from '../models/Room';
import Device from '../models/Device';
import { AuthRequest } from '../middleware/auth';

const roomImageMap: Record<string, string> = {
  'Living Room': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
  Bedroom: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600',
  Kitchen: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600',
  Office: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600',
  Laboratory: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600',
  Garage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600',
  Hall: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600',
  Classroom: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600',
  Hostel: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600',
  'Custom Room': 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=600',
};

export const getRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homeId = req.query.homeId || req.user.activeHomeId;
    const rooms = await Room.find({ homeId }).sort({ createdAt: -1 });

    // Calculate aggregated real-time power and device count for each room
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const devices = await Device.find({ roomId: room._id });
        let totalPowerW = 0;
        let totalEnergyKWh = 0;
        let activeCount = 0;

        devices.forEach((d) => {
          if (d.relayState) {
            totalPowerW += d.powerW;
            activeCount++;
          }
          totalEnergyKWh += d.energyKWh;
        });

        const status = activeCount > 0 ? 'active' : devices.length > 0 ? 'idle' : 'offline';

        return {
          ...room.toObject(),
          deviceCount: devices.length,
          totalPowerW: Math.round(totalPowerW),
          totalEnergyKWh: Number(totalEnergyKWh.toFixed(2)),
          status,
        };
      })
    );

    res.status(200).json({ success: true, rooms: enrichedRooms });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, homeId, imageUrl } = req.body;
    const targetHomeId = homeId || req.user.activeHomeId;

    const newRoom = await Room.create({
      name,
      type,
      homeId: targetHomeId,
      imageUrl: imageUrl || roomImageMap[type] || roomImageMap['Custom Room'],
      deviceCount: 0,
      totalPowerW: 0,
      totalEnergyKWh: 0,
      status: 'idle',
    });

    res.status(201).json({ success: true, room: newRoom });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { name, type, imageUrl } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    if (name) room.name = name;
    if (type) {
      room.type = type;
      if (!imageUrl) room.imageUrl = roomImageMap[type];
    }
    if (imageUrl) room.imageUrl = imageUrl;

    await room.save();
    res.status(200).json({ success: true, room });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    await Room.findByIdAndDelete(roomId);
    await Device.deleteMany({ roomId });

    res.status(200).json({ success: true, message: 'Room and attached devices deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homeId = req.query.homeId || req.user.activeHomeId;
    const notifications = await Notification.find({ homeId }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ homeId, read: false });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    if (notificationId === 'all') {
      const homeId = req.query.homeId || req.user.activeHomeId;
      await Notification.updateMany({ homeId, read: false }, { read: true });
    } else {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    }
    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const clearNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homeId = req.query.homeId || req.user.activeHomeId;
    await Notification.deleteMany({ homeId });
    res.status(200).json({ success: true, message: 'All notifications cleared' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

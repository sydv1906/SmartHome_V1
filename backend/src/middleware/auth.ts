import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Check if demo bypass header is passed for development testing
    const mockUserId = req.headers['x-mock-user-id'] as string;
    if (mockUserId && process.env.NODE_ENV !== 'production') {
      const mockUser = await User.findById(mockUserId);
      if (mockUser) {
        req.user = mockUser;
        return next();
      }
    }

    res.status(401).json({ success: false, message: 'Access token missing or invalid' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'smarthome_super_secret_jwt_key_2026_production';
    const decoded: any = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      res.status(401).json({ success: false, message: 'User token invalid or user deleted' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Token expired or invalid signature' });
  }
};

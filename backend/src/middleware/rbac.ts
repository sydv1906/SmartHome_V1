import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated user' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: ${req.user.role} role does not have permission for this operation`,
      });
      return;
    }

    next();
  };
};

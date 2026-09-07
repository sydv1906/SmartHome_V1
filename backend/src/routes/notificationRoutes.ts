import { Router } from 'express';
import { getNotifications, markAsRead, clearNotifications } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', getNotifications);
router.put('/:notificationId/read', markAsRead);
router.delete('/', clearNotifications);

export default router;

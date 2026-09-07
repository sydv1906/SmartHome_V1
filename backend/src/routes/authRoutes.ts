import { Router } from 'express';
import { register, login, refreshToken, getMe, googleAuthMock } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/google', googleAuthMock);
router.get('/me', authenticateJWT, getMe);

export default router;

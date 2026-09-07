import { Router } from 'express';
import { getHomes, createHome, setHomeMode, getDashboardStats } from '../controllers/homeController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', getHomes);
router.post('/', createHome);
router.put('/:homeId/mode', setHomeMode);
router.get('/stats', getDashboardStats);

export default router;

import { Router } from 'express';
import { getEnergyAnalytics, exportAnalyticsCSV } from '../controllers/analyticsController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', getEnergyAnalytics);
router.get('/export', exportAnalyticsCSV);

export default router;

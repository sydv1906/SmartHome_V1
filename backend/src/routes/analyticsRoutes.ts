import { Router } from 'express';
import { getEnergyAnalytics, exportAnalyticsCSV } from '../controllers/analyticsController';
import { getBillingConsumption } from '../controllers/billingController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/billing-consumption', getBillingConsumption);
router.get('/', getEnergyAnalytics);
router.get('/export', exportAnalyticsCSV);

export default router;

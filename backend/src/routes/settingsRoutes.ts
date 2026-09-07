import { Router } from 'express';
import {
  getSettings,
  updateUserSettings,
  updateTariffBilling,
  generateApiToken,
} from '../controllers/settingsController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', getSettings);
router.put('/user', updateUserSettings);
router.put('/tariff', updateTariffBilling);
router.post('/api-token', generateApiToken);

export default router;

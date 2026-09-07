import { Router } from 'express';
import { getFirmwareList, createFirmware } from '../controllers/firmwareController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', getFirmwareList);
router.post('/', createFirmware);

export default router;

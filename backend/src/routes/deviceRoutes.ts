import { Router } from 'express';
import {
  getDevices,
  createDevice,
  toggleRelay,
  updateDevice,
  deleteDevice,
  triggerDeviceOta,
} from '../controllers/deviceController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', getDevices);
router.post('/', createDevice);
router.put('/:deviceId/relay', toggleRelay);
router.put('/:deviceId', updateDevice);
router.delete('/:deviceId', deleteDevice);
router.post('/:deviceId/ota', triggerDeviceOta);

export default router;

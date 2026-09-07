import { Router } from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/roomController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', getRooms);
router.post('/', createRoom);
router.put('/:roomId', updateRoom);
router.delete('/:roomId', deleteRoom);

export default router;

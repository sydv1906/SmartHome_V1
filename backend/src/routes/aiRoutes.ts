import { Router } from 'express';
import { getAIRecommendations } from '../controllers/aiController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/recommendations', getAIRecommendations);

export default router;

import { Router } from 'express';
import { getAIRecommendations, postAssistantMessage } from '../controllers/aiController';
import { authenticateJWT } from '../middleware/auth';
import { aiAssistantLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticateJWT);
router.get('/recommendations', getAIRecommendations);
router.post('/assistant', aiAssistantLimiter, postAssistantMessage);

export default router;

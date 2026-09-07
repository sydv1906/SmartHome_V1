import { Router } from 'express';
import {
  getAutomations,
  createAutomationRule,
  toggleRule,
  deleteRule,
  createSchedule,
  toggleSchedule,
  deleteSchedule,
} from '../controllers/automationController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', getAutomations);
router.post('/rules', createAutomationRule);
router.put('/rules/:ruleId/toggle', toggleRule);
router.delete('/rules/:ruleId', deleteRule);

router.post('/schedules', createSchedule);
router.put('/schedules/:scheduleId/toggle', toggleSchedule);
router.delete('/schedules/:scheduleId', deleteSchedule);

export default router;

import { Router } from 'express';
import { getAdminOverview, updateUserRole, deleteUser } from '../controllers/adminController';
import { authenticateJWT } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);
router.use(requireRoles(['Admin']));

router.get('/overview', getAdminOverview);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

export default router;

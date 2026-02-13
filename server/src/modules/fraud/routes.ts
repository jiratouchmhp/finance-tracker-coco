import { Router } from 'express';
import * as fraudController from './controller';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/alerts', requireAuth, requireRole('OWNER'), fraudController.getAlerts);
router.get('/dashboard', requireAuth, requireRole('OWNER'), fraudController.getDashboard);

export default router;

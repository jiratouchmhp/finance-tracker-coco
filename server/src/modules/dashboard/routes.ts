import { Router } from 'express';
import * as dashboardController from './controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.get('/daily', requireAuth, dashboardController.getDaily);
router.get('/weekly', requireAuth, dashboardController.getWeekly);
router.get('/monthly', requireAuth, dashboardController.getMonthly);
router.get('/report', requireAuth, dashboardController.getReport);
router.get('/custom', requireAuth, dashboardController.getCustomRange);

export default router;

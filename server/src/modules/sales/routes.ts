import { Router } from 'express';
import * as salesController from './controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/', requireAuth, salesController.create);
router.get('/by-date', requireAuth, salesController.getByDate);
router.get('/by-week', requireAuth, salesController.getByWeek);
router.get('/by-month', requireAuth, salesController.getByMonth);
router.get('/by-range', requireAuth, salesController.getByRange);
router.get('/analytics', requireAuth, salesController.getAnalytics);
router.delete('/:id', requireAuth, salesController.remove);

export default router;

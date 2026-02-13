import { Router } from 'express';
import * as expenseController from './controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/', requireAuth, expenseController.create);
router.get('/by-date', requireAuth, expenseController.getByDate);
router.get('/fixed-by-month', requireAuth, expenseController.getFixedByMonth);
router.get('/summary', requireAuth, expenseController.getMonthlySummary);
router.delete('/:id', requireAuth, expenseController.remove);

export default router;

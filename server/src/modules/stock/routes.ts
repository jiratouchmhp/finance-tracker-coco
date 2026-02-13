import { Router } from 'express';
import * as stockController from './controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/', requireAuth, stockController.addEntry);
router.get('/levels', requireAuth, stockController.getLevels);
router.get('/history/:productId', requireAuth, stockController.getHistory);

export default router;

import { Router } from 'express';
import * as productController from './controller';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/', requireAuth, productController.getAll);
router.get('/:id', requireAuth, productController.getById);
router.post('/', requireAuth, requireRole('OWNER'), productController.create);
router.put('/:id', requireAuth, requireRole('OWNER'), productController.update);
router.delete('/:id', requireAuth, requireRole('OWNER'), productController.remove);

export default router;

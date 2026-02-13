import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as userController from './controller';

const router = Router();

// All user management routes require authentication and OWNER role
router.use(requireAuth);
router.use(requireRole('OWNER'));

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.put('/:id/password', userController.updatePassword);
router.delete('/:id', userController.remove);

export default router;

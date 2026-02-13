import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as authController from './controller';

const router = Router();

router.post('/login', authController.login);
router.post('/register', requireAuth, requireRole('OWNER'), authController.register);

export default router;

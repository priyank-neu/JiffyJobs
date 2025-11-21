import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All user routes require admin access
router.use(authenticate);
router.use(requireAdmin);

router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUserById);

export default router;


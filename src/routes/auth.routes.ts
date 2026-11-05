import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/auth.controller';
import { roleUpdateSchema } from '../validators/users.validator';

const router = Router();
router.use(authMiddleware);

router.get('/auth/me', controller.me);
router.get('/users', requireRole('admin'), controller.listUsers);
router.patch('/users/:id/role', requireRole('admin'), validate(roleUpdateSchema), controller.updateRole);

export default router;

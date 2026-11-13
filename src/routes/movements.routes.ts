import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole, INVENTORY_MANAGERS } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/movements.controller';
import { movementCreateSchema } from '../validators/movements.validator';

const router = Router();
router.use(authMiddleware);

router.post('/batches/:id/movements', requireRole(...INVENTORY_MANAGERS), validate(movementCreateSchema), controller.create);
router.get('/movements', controller.listAll);
router.get('/medicines/:id/movements', controller.list);

export default router;

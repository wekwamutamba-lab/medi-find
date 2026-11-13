import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole, INVENTORY_MANAGERS } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/batches.controller';
import { batchCreateSchema, batchUpdateSchema } from '../validators/batches.validator';

const router = Router();
router.use(authMiddleware);

router.get('/batches', controller.listAll);
router.post('/medicines/:id/batches', requireRole(...INVENTORY_MANAGERS), validate(batchCreateSchema), controller.create);
router.get('/medicines/:id/batches', controller.list);
router.patch('/batches/:id', requireRole(...INVENTORY_MANAGERS), validate(batchUpdateSchema), controller.update);

export default router;

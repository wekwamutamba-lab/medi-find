import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/movements.controller';
import { movementCreateSchema } from '../validators/movements.validator';

const router = Router();
router.use(authMiddleware);

router.post('/batches/:id/movements', validate(movementCreateSchema), controller.create);
router.get('/medicines/:id/movements', controller.list);

export default router;

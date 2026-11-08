import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { saleCreateSchema } from '../validators/sales.validator';
import * as controller from '../controllers/sales.controller';

const router = Router();
router.use(authMiddleware);
router.get('/sales', controller.list);
router.get('/sales/analytics', controller.analytics);
router.post('/sales', validate(saleCreateSchema), controller.create);
export default router;

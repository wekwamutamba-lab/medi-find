import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole, SALES_ROLES, PHARMACY_STAFF } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { saleCreateSchema } from '../validators/sales.validator';
import * as controller from '../controllers/sales.controller';

const router = Router();
router.use(authMiddleware);
router.get('/sales', requireRole(...PHARMACY_STAFF), controller.list);
router.get('/sales/analytics', requireRole(...PHARMACY_STAFF), controller.analytics);
router.post('/sales', requireRole(...SALES_ROLES), validate(saleCreateSchema), controller.create);
export default router;

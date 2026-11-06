import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/medicines.controller';
import { medicineCreateSchema, medicineUpdateSchema, medicineListQuerySchema } from '../validators/medicines.validator';

const router = Router();
router.use(authMiddleware);

router.get('/medicines', validate(medicineListQuerySchema, 'query'), controller.list);
router.post('/medicines', validate(medicineCreateSchema), controller.create);
router.get('/medicines/:id', controller.getOne);
router.patch('/medicines/:id', validate(medicineUpdateSchema), controller.update);
router.delete('/medicines/:id', requireRole('admin'), controller.remove);

export default router;

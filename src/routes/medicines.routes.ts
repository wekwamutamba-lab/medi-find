import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/medicines.controller';
import { medicineCreateSchema, medicineUpdateSchema, medicineListQuerySchema } from '../validators/medicines.validator';

const router = Router();
router.use(authMiddleware);

router.get('/', validate(medicineListQuerySchema, 'query'), controller.list);
router.post('/', validate(medicineCreateSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(medicineUpdateSchema), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

export default router;

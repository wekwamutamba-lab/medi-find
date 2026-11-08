import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { customerCreateSchema, supplierCreateSchema } from '../validators/directory.validator';
import * as controller from '../controllers/directory.controller';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);
router.get('/customers', controller.listCustomers);
router.post('/customers', validate(customerCreateSchema), controller.createCustomer);
router.patch('/customers/:id', validate(customerCreateSchema.partial()), controller.updateCustomer);
router.delete('/customers/:id', controller.deleteCustomer);
router.get('/suppliers', controller.listSuppliers);
router.post('/suppliers', validate(supplierCreateSchema), controller.createSupplier);
router.patch('/suppliers/:id', validate(supplierCreateSchema.partial().extend({ is_active: z.boolean().optional() })), controller.updateSupplier);
router.delete('/suppliers/:id', controller.deleteSupplier);
export default router;

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole, INVENTORY_MANAGERS } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { customerCreateSchema, supplierCreateSchema } from '../validators/directory.validator';
import * as controller from '../controllers/directory.controller';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);
router.get('/customers', controller.listCustomers);
router.post('/customers', requireRole(...INVENTORY_MANAGERS), validate(customerCreateSchema), controller.createCustomer);
router.patch('/customers/:id', requireRole(...INVENTORY_MANAGERS), validate(customerCreateSchema.partial()), controller.updateCustomer);
router.delete('/customers/:id', requireRole(...INVENTORY_MANAGERS), controller.deleteCustomer);
router.get('/suppliers', controller.listSuppliers);
router.post('/suppliers', requireRole(...INVENTORY_MANAGERS), validate(supplierCreateSchema), controller.createSupplier);
router.patch('/suppliers/:id', requireRole(...INVENTORY_MANAGERS), validate(supplierCreateSchema.partial().extend({ is_active: z.boolean().optional() })), controller.updateSupplier);
router.delete('/suppliers/:id', requireRole(...INVENTORY_MANAGERS), controller.deleteSupplier);
export default router;

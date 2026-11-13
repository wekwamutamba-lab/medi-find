import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole, INVENTORY_MANAGERS } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/purchase_orders.controller';
import { purchaseOrderCreateSchema, purchaseOrderReceiveSchema, purchaseOrderCancelSchema, updatePurchaseOrderItemReceivedSchema } from '../validators/purchase_orders.validator';

const router = Router();
router.use(authMiddleware);

router.get('/purchase-orders', controller.list);
router.get('/purchase-orders/:id', controller.getOne);
router.get('/purchase-orders/:id/items', controller.getItems);
router.post('/purchase-orders', requireRole(...INVENTORY_MANAGERS), validate(purchaseOrderCreateSchema), controller.create);
router.post('/purchase-orders/receive', requireRole(...INVENTORY_MANAGERS), validate(purchaseOrderReceiveSchema), controller.receive);
router.patch('/purchase-orders/:id/cancel', requireRole(...INVENTORY_MANAGERS), controller.cancel);
router.patch('/purchase-orders/:id/items', requireRole(...INVENTORY_MANAGERS), validate(updatePurchaseOrderItemReceivedSchema), controller.updateStatus);

export default router;
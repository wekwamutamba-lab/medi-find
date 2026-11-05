import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/alerts.controller';
import { alertSettingsSchema } from '../validators/users.validator';

const router = Router();
router.use(authMiddleware);

router.get('/alerts/low-stock', controller.lowStock);
router.get('/alerts/expiring', controller.expiring);
router.get('/alerts/summary', controller.summary);
router.get('/alerts/settings', requireRole('admin'), controller.getSettings);
router.patch('/alerts/settings', requireRole('admin'), validate(alertSettingsSchema), controller.updateSettings);

export default router;

import { Router } from 'express';
import * as controller from '../controllers/health.controller';

const router = Router();
router.get('/health', controller.health);

export default router;

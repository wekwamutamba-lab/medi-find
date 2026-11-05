import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimit } from 'express-rate-limit';
import * as controller from '../controllers/ai.controller';
import { aiAskSchema } from '../validators/ai.validator';
import { env } from '../config/env';

const router = Router();
router.use(authMiddleware);

const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: env.AI_RATE_LIMIT_PER_5MIN,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ data: null, error: { code: 'AI_UNAVAILABLE', message: 'Rate limit exceeded' } });
  },
});

router.post('/ai/ask', aiLimiter, validate(aiAskSchema), controller.ask);

export default router;

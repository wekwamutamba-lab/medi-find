import { Request, Response, NextFunction } from 'express';
import { askAi } from '../services/ai.service';
import { aiAskSchema } from '../validators/ai.validator';

export async function ask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = aiAskSchema.parse(req.body);
    const result = await askAi(req.user!.id, data.question, data.conversation_id);
    res.json({ data: result, error: null });
  } catch (e) {
    next(e);
  }
}

import { z } from 'zod';

export const aiAskSchema = z.object({
  question: z.string().min(1).max(500),
  conversation_id: z.string().uuid().optional(),
});

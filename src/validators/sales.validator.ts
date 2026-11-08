import { z } from 'zod';

export const saleCreateSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  payment_method: z.enum(['cash', 'card', 'transfer']),
  tax_rate: z.coerce.number().min(0).max(25).default(0),
  items: z.array(z.object({
    medicine_id: z.string().uuid(),
    quantity_packs: z.coerce.number().int().positive(),
  })).min(1).max(100),
});

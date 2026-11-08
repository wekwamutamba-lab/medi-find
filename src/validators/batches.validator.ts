import { z } from 'zod';

export const batchCreateSchema = z.object({
  batch_number: z.string().min(1).max(100),
  manufacturing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expiry_date must be YYYY-MM-DD'),
  quantity_packs: z.coerce.number().int().min(0),
  unit_cost: z.coerce.number().min(0).optional().default(0),
});

export const batchUpdateSchema = z.object({
  batch_number: z.string().min(1).max(100).optional(),
  manufacturing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'expiry_date must be YYYY-MM-DD')
    .optional(),
});

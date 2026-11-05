import { z } from 'zod';

export const movementCreateSchema = z
  .object({
    movement_type: z.enum(['receipt', 'issue', 'adjustment']),
    quantity_packs: z.coerce.number().int().refine((v) => v !== 0, 'quantity_packs must not be 0'),
    reason: z.string().max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.movement_type === 'receipt' && data.quantity_packs <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Receipt quantity must be positive', path: ['quantity_packs'] });
    }
    if (data.movement_type === 'issue' && data.quantity_packs >= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Issue quantity must be negative', path: ['quantity_packs'] });
    }
    if (data.movement_type === 'adjustment' && !data.reason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Reason is required for adjustments', path: ['reason'] });
    }
  });



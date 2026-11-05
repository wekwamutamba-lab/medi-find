import { z } from 'zod';

export const medicineCreateSchema = z.object({
  name: z.string().min(1).max(200),
  strength: z.string().min(1).max(100),
  dosage_form: z.string().min(1).max(50),
  pack_size: z.coerce.number().int().positive(),
  reorder_level: z.coerce.number().int().min(0).default(0),
  notes: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const medicineUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  strength: z.string().min(1).max(100).optional(),
  reorder_level: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const medicineListQuerySchema = z.object({
  search: z.string().optional(),
  low_stock: z.enum(['true', 'false']).optional(),
  include_inactive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

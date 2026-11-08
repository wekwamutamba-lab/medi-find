import { z } from 'zod';

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contact_name: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
});

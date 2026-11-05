import { z } from 'zod';

export const roleUpdateSchema = z.object({
  role: z.enum(['admin', 'pharmacist']),
});

export const alertSettingsSchema = z.object({
  expiry_warning_days: z.coerce.number().int().min(1).max(365),
});

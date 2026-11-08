import { z } from 'zod';

export const roleUpdateSchema = z.object({
  role: z.enum(['admin', 'pharmacist', 'staff']),
});

export const pharmacyOnboardSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  pharmacy_name: z.string().trim().min(1).max(200),
  license_number: z.string().trim().min(1).max(100),
});

export const alertSettingsSchema = z.object({
  expiry_warning_days: z.coerce.number().int().min(1).max(365),
});

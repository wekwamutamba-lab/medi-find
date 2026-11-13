import { z } from 'zod';

export const purchaseOrderCreateSchema = z.object({
  supplier_id: z.string().uuid().optional().nullable(),
  po_number: z.string().trim().min(1).max(100),
  items: z.array(z.object({
    medicine_id: z.string().uuid(),
    batch_number: z.string().trim().min(1).max(100),
    expiry_date: z.string().datetime().or(z.string().date()),
    quantity_packs: z.coerce.number().int().positive(),
    unit_cost: z.coerce.number().min(0),
  })).min(1),
  notes: z.string().max(1000).optional().nullable(),
});

export const purchaseOrderReceiveSchema = z.object({
  id: z.string().uuid(),
});

export const purchaseOrderCancelSchema = z.object({
  id: z.string().uuid(),
});

export const updatePurchaseOrderItemReceivedSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  received_quantity_packs: z.coerce.number().int().min(0),
});
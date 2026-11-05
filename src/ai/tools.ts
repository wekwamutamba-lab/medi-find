import { z } from 'zod';

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'get_low_stock_items',
      description: 'Get medicines whose usable (non-expired) stock is below their reorder level.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_expiring_batches',
      description: 'Get batches expiring within N days plus already-expired batches with remaining stock.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days ahead (1-365)' },
        },
        required: ['days'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_medicine_stock',
      description: 'Get stock details for one or many medicines, including batch-level quantities.',
      parameters: {
        type: 'object',
        properties: {
          medicine_id: { type: 'string', description: 'UUID of a specific medicine' },
          name_search: { type: 'string', description: 'Partial name search' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_movements',
      description: 'Get recent stock movements for a medicine.',
      parameters: {
        type: 'object',
        properties: {
          medicine_id: { type: 'string', description: 'UUID of the medicine' },
          limit: { type: 'number', description: 'Max records (1-100)' },
        },
        required: ['medicine_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attention_summary',
      description: 'Get the daily attention summary: low stock, expiring, expired, missing data.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
];

export const toolArgSchemas: Record<string, z.ZodSchema> = {
  get_low_stock_items: z.object({}),
  get_expiring_batches: z.object({ days: z.coerce.number().int().min(1).max(365) }),
  get_medicine_stock: z.object({
    medicine_id: z.string().uuid().optional(),
    name_search: z.string().max(200).optional(),
  }),
  get_stock_movements: z.object({
    medicine_id: z.string().uuid(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  get_attention_summary: z.object({}),
};

export const ALLOWED_TOOLS = new Set(Object.keys(toolArgSchemas));

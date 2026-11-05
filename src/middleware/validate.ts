import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const message = Object.entries(fieldErrors)
        .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
        .join('; ');
      return res.status(400).json({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: message || 'Validation failed' },
      });
    }
    req[source] = result.data;
    next();
  };
}

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;
  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err?.statusCode || 500;
  const code = err?.code || (status === 500 ? 'INTERNAL' : 'ERROR');
  const message = status === 500 ? 'Internal server error' : err.message;
  if (status === 500) {
    console.error('Server error:', err);
  }
  res.status(status).json({ data: null, error: { code, message } });
}

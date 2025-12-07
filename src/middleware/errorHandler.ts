import { Request, Response, NextFunction } from 'express';
import { log } from '../logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Avoid logging complex objects that may contain BigInt directly to the console
  try {
    const msg = typeof err === 'string' ? err : (err?.message ? String(err.message) : JSON.stringify(err));
    log.error(msg);
  } catch {
    log.error(String(err));
  }
  res.status(err?.status || 500).json({ error: err?.message || 'Internal Server Error' });
}

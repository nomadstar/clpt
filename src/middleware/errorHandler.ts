import { Request, Response, NextFunction } from 'express';
import { log } from '../logger';
import { HttpError } from '../errors/HttpError';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Normalize error to standardized format
  try {
    if (err instanceof HttpError) {
      log.error(err.message);
      return res.status(err.status).json({ code: err.code, message: err.message, details: err.details });
    }
    const message = err?.message || String(err) || 'Internal Server Error';
    log.error(message);
    return res.status(err?.status || 500).json({ code: 'INTERNAL_ERROR', message, details: null });
  } catch (e) {
    log.error('errorHandler failure', e);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Internal Server Error' });
  }
}

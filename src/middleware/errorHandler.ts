import { Request, Response, NextFunction } from 'express';
import { log } from '../logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  log.error(err?.message || err);
  res.status(err?.status || 500).json({ error: err?.message || 'Internal Server Error' });
}

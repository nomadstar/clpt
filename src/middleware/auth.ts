import { Request, Response, NextFunction } from 'express';
import { getMerchantByApiKey } from '../repositories/merchantRepo';
import { HttpError } from '../errors/HttpError';

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = (req.header('X-API-Key') || '').trim();
  if (!apiKey) {
    return next(new HttpError(401, 'AUTH_MISSING_API_KEY', 'Missing X-API-Key header'));
  }
  try {
    const merchant = await getMerchantByApiKey(apiKey);
    if (!merchant) return next(new HttpError(401, 'AUTH_INVALID_API_KEY', 'Invalid API key'));
    // attach merchant to request
    (req as any).merchant = merchant;
    return next();
  } catch (err) {
    return next(new HttpError(500, 'AUTH_ERROR', 'Authentication error', { err }));
  }
}

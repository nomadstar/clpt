import fetch from 'node-fetch';
import { log } from '../logger';

export const dispatchMerchantCallback = async (url: string, payload: any) => {
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    log.info('callback dispatched', url, res.status);
  } catch (err) {
    log.error('callback failed', err);
  }
};

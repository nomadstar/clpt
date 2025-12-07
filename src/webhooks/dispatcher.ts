import axios from 'axios';
import { log } from '../logger';

export const dispatchMerchantCallback = async (url: string, payload: any) => {
  try {
    const res = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    log.info('callback dispatched', url, res.status);
  } catch (err: any) {
    log.error('callback failed', err?.message || err);
  }
};

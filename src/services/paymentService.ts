import { createPaymentIntent, getPaymentIntentById, findPendingByAddressAndAmount, markPaid } from '../repositories/paymentIntentRepo';
import { getMerchantById } from '../repositories/merchantRepo';
import { v4 as uuidv4 } from 'uuid';

export const createIntent = async (opts: {
  merchantId: string;
  amount: string | number;
  description?: string;
  expiresInSeconds?: number;
  metadata?: any;
}) => {
  const merchant = await getMerchantById(opts.merchantId);
  if (!merchant) throw { status: 404, message: 'merchant not found' };
  const id = uuidv4();
  const amountMinor = BigInt(opts.amount.toString());
  const expiresIn = opts.expiresInSeconds ?? 300;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const merchantAddress = merchant.clpnyReceivingAddress;
  const qrPayload = `CLPNY|${merchantAddress}|${amountMinor.toString()}|${id}`;
  const pi = await createPaymentIntent({
    merchantId: opts.merchantId,
    amount: amountMinor,
    description: opts.description ?? null,
    expiresAt,
    qrPayload,
    merchantAddress,
    metadata: opts.metadata ? JSON.stringify(opts.metadata) : null
  });
  return pi;
};

export const handleBlockchainWebhook = async (payload: { txHash: string; from: string; to: string; amount: string; paymentIntentId?: string }) => {
  // If paymentIntentId provided, prefer it
  if (payload.paymentIntentId) {
    const pi = await getPaymentIntentById(payload.paymentIntentId);
    if (!pi) return { updated: false, reason: 'not_found' };
    if (pi.status === 'PAID') return { updated: false, reason: 'already_paid' };
    if (new Date() > pi.expiresAt) return { updated: false, reason: 'expired' };
    if (pi.merchantAddress.toLowerCase() !== payload.to.toLowerCase()) return { updated: false, reason: 'address_mismatch' };
    const amt = BigInt(payload.amount.toString());
    if (amt < BigInt(pi.amount.toString())) return { updated: false, reason: 'amount_too_small' };
    await markPaid(pi.id, payload.txHash);
    return { updated: true };
  }

  // No paymentIntentId: try to match
  const amt = BigInt(payload.amount.toString());
  const candidates = await findPendingByAddressAndAmount(payload.to, amt);
  const now = new Date();
  const valid = candidates.filter(c => new Date(c.expiresAt) > now);
  if (valid.length === 1) {
    await markPaid(valid[0].id, payload.txHash);
    return { updated: true };
  }
  if (valid.length === 0) return { updated: false, reason: 'no_match' };
  return { updated: false, reason: 'multiple_matches' };
};

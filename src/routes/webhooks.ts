import express from 'express';
import { handleBlockchainWebhook } from '../services/paymentService';
import { getMerchantById } from '../repositories/merchantRepo';
import { dispatchMerchantCallback } from '../webhooks/dispatcher';

const router = express.Router();

router.post('/blockchain', async (req, res, next) => {
  try {
    const { txHash, from, to, amount, paymentIntentId } = req.body;
    const result = await handleBlockchainWebhook({ txHash, from, to, amount: amount.toString(), paymentIntentId });

    // if updated, find merchant and call callback
    if (result.updated && paymentIntentId) {
      const pi = await (await import('../repositories/paymentIntentRepo')).getPaymentIntentById(paymentIntentId);
      const merchant = await getMerchantById(pi.merchantId);
      if (merchant?.callbackUrl) {
        dispatchMerchantCallback(merchant.callbackUrl, { paymentIntentId: pi.id, status: 'PAID', txHash });
      }
    }

    res.json(result);
  } catch (err) { next(err); }
});

export default router;

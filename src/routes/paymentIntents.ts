import express from 'express';
import { createIntent } from '../services/paymentService';
import { getPaymentIntentById } from '../repositories/paymentIntentRepo';
import { serializeForJson } from '../utils/serialize';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { merchantId, amount, description, expiresInSeconds, metadata } = req.body;
    const pi = await createIntent({ merchantId, amount, description, expiresInSeconds, metadata });
    res.status(201).json(serializeForJson(pi));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pi = await getPaymentIntentById(req.params.id);
    if (!pi) return res.status(404).json({ error: 'not found' });
    res.json(serializeForJson(pi));
  } catch (err) { next(err); }
});

export default router;

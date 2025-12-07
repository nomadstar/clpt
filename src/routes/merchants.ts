import express from 'express';
import { createMerchant, getMerchantById } from '../repositories/merchantRepo';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, clpnyReceivingAddress, callbackUrl } = req.body;
    const m = await createMerchant({ name, clpnyReceivingAddress, callbackUrl });
    res.status(201).json(m);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const m = await getMerchantById(req.params.id);
    if (!m) return res.status(404).json({ error: 'not found' });
    res.json(m);
  } catch (err) { next(err); }
});

export default router;

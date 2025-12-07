import request from 'supertest';
import { app } from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // ensure clean DB - for tests user must run with test DATABASE_URL
  await prisma.$connect();
  await prisma.paymentIntent.deleteMany();
  await prisma.merchant.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

test('merchant -> create, payment intent, webhook marks paid (idempotent)', async () => {
  const merchantRes = await request(app).post('/merchants').send({ name: 'Shop A', clpnyReceivingAddress: '0xabc', callbackUrl: null });
  expect(merchantRes.status).toBe(201);
  const merchant = merchantRes.body;

  const piRes = await request(app).post('/payment-intents').send({ merchantId: merchant.id, amount: '1000', description: 'order', expiresInSeconds: 300 });
  expect(piRes.status).toBe(201);
  const pi = piRes.body;
  expect(pi.status).toBe('PENDING');

  // hit webhook
  const webhookRes = await request(app).post('/webhooks/blockchain').send({ txHash: '0x1', from: '0xfrom', to: '0xabc', amount: '1000', paymentIntentId: pi.id });
  expect(webhookRes.status).toBe(200);
  expect(webhookRes.body.updated).toBe(true);

  // check PI status
  const piGet = await request(app).get(`/payment-intents/${pi.id}`);
  expect(piGet.status).toBe(200);
  expect(piGet.body.status).toBe('PAID');

  // send same webhook again - idempotent
  const webhookRes2 = await request(app).post('/webhooks/blockchain').send({ txHash: '0x1', from: '0xfrom', to: '0xabc', amount: '1000', paymentIntentId: pi.id });
  expect(webhookRes2.status).toBe(200);
  expect(webhookRes2.body.updated).toBe(false);
});

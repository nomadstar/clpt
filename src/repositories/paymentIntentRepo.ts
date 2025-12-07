import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPaymentIntent = async (data: {
  merchantId: string;
  amount: bigint;
  description?: string | null;
  expiresAt: Date;
  qrPayload: string;
  merchantAddress: string;
  metadata?: string | null;
}) => {
  return prisma.paymentIntent.create({ data: {
    merchantId: data.merchantId,
    amount: data.amount,
    description: data.description,
    expiresAt: data.expiresAt,
    qrPayload: data.qrPayload,
    merchantAddress: data.merchantAddress,
    metadata: data.metadata,
    status: 'PENDING'
  }});
};

export const getPaymentIntentById = async (id: string) => {
  return prisma.paymentIntent.findUnique({ where: { id } });
};

export const findPendingByAddressAndAmount = async (address: string, amount: bigint) => {
  return prisma.paymentIntent.findMany({ where: {
    merchantAddress: address,
    amount,
    status: 'PENDING'
  }});
};

export const markPaid = async (id: string, txHash: string) => {
  return prisma.paymentIntent.update({ where: { id }, data: { status: 'PAID', blockchainTxHash: txHash } });
};

export const markExpired = async (id: string) => {
  return prisma.paymentIntent.update({ where: { id }, data: { status: 'EXPIRED' } });
};

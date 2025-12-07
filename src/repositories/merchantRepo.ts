import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const createMerchant = async (data: { name: string; clpnyReceivingAddress: string; callbackUrl?: string, apiKey?: string }) => {
  const apiKey = data.apiKey ?? uuidv4();
  return prisma.merchant.create({ data: { name: data.name, clpnyReceivingAddress: data.clpnyReceivingAddress, callbackUrl: data.callbackUrl ?? null, apiKey } });
};

export const getMerchantById = async (id: string) => {
  return prisma.merchant.findUnique({ where: { id } });
};

export const getMerchantByApiKey = async (apiKey: string) => {
  return prisma.merchant.findUnique({ where: { apiKey } });
};

export const closePrisma = async () => {
  await prisma.$disconnect();
};

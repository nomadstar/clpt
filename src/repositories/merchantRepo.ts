import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createMerchant = async (data: { name: string; clpnyReceivingAddress: string; callbackUrl?: string }) => {
  return prisma.merchant.create({ data });
};

export const getMerchantById = async (id: string) => {
  return prisma.merchant.findUnique({ where: { id } });
};

export const closePrisma = async () => {
  await prisma.$disconnect();
};

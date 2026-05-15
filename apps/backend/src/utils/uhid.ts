import { PrismaClient } from '@prisma/client';

export const generateUhid = async (prisma: PrismaClient | any) => {
  const year = new Date().getUTCFullYear();
  const prefix = `HSP-${year}-`;

  const latest = await prisma.patient.findFirst({
    where: { uhid: { startsWith: prefix } },
    orderBy: { uhid: 'desc' },
    select: { uhid: true },
  });

  const lastNumber = latest?.uhid ? Number(latest.uhid.slice(prefix.length)) : 0;
  const nextNumber = String(lastNumber + 1).padStart(6, '0');
  return `${prefix}${nextNumber}`;
};

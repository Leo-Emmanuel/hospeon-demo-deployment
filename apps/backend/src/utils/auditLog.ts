import { PrismaClient } from '@prisma/client';

interface AuditInput {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
}

export const writeAuditLog = async (prisma: PrismaClient | any, input: AuditInput) => {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: input.oldValues as any,
      newValues: input.newValues as any,
      ipAddress: input.ipAddress,
    },
  });
};

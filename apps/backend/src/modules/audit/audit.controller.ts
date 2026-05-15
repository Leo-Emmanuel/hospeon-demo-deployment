import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';

export const listAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const dateFrom = req.query.dateFrom ? new Date(`${String(req.query.dateFrom)}T00:00:00.000Z`) : undefined;
  const dateTo = req.query.dateTo ? new Date(`${String(req.query.dateTo)}T23:59:59.999Z`) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 100;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(req.query.entityType && { entityType: String(req.query.entityType) }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: { select: { id: true, name: true, role: true } } },
  });
  return successResponse(res, logs, 'Audit logs fetched');
});

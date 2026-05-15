import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { writeAuditLog } from '../../utils/auditLog';

export const listDepartments = catchAsync(async (_req: Request, res: Response) => {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' }, include: { headDoctor: { select: { id: true, name: true } } } });
  return successResponse(res, departments, 'Departments fetched');
});

export const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await prisma.$transaction(async (tx) => {
    const created = await tx.department.create({ data: req.body });
    await writeAuditLog(tx, { actorId: req.user?.userId, action: 'CREATE', entityType: 'departments', entityId: created.id, newValues: created, ipAddress: req.ip });
    return created;
  });
  return successResponse(res, department, 'Department created', 201);
});

export const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await prisma.$transaction(async (tx) => {
    const updated = await tx.department.update({ where: { id: req.params.id }, data: req.body });
    await writeAuditLog(tx, { actorId: req.user?.userId, action: 'UPDATE', entityType: 'departments', entityId: updated.id, newValues: updated, ipAddress: req.ip });
    return updated;
  });
  return successResponse(res, department, 'Department updated');
});

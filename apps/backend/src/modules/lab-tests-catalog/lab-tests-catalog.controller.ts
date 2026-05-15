import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { writeAuditLog } from '../../utils/auditLog';

export const listLabTestsCatalog = catchAsync(async (req: Request, res: Response) => {
  const showAll = req.query.showAll === 'true' && req.user?.role === 'ADMIN';
  const tests = await prisma.labTestCatalog.findMany({
    where: showAll ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
  return successResponse(res, tests, 'Lab tests catalog fetched');
});

export const createLabTest = catchAsync(async (req: Request, res: Response) => {
  return prisma.$transaction(async (tx) => {
    const test = await tx.labTestCatalog.create({ data: req.body });
    await writeAuditLog(tx, { actorId: req.user?.userId, action: 'CREATE', entityType: 'lab_tests_catalog', entityId: test.id, newValues: test, ipAddress: req.ip });
    return successResponse(res, test, 'Lab test created', 201);
  });
});

export const updateLabTest = catchAsync(async (req: Request, res: Response) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.labTestCatalog.findUnique({ where: { id: req.params.id } });
    if (!existing) return successResponse(res, null, 'Lab test not found', 404);
    const test = await tx.labTestCatalog.update({ where: { id: req.params.id }, data: req.body });
    await writeAuditLog(tx, { actorId: req.user?.userId, action: 'UPDATE', entityType: 'lab_tests_catalog', entityId: test.id, oldValues: existing, newValues: test, ipAddress: req.ip });
    return successResponse(res, test, 'Lab test updated');
  });
});

export const toggleLabTest = catchAsync(async (req: Request, res: Response) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.labTestCatalog.findUnique({ where: { id: req.params.id } });
    if (!existing) return successResponse(res, null, 'Lab test not found', 404);
    const test = await tx.labTestCatalog.update({ where: { id: req.params.id }, data: { isActive: !existing.isActive } });
    await writeAuditLog(tx, { actorId: req.user?.userId, action: 'UPDATE', entityType: 'lab_tests_catalog', entityId: test.id, oldValues: existing, newValues: test, ipAddress: req.ip });
    return successResponse(res, test, `Lab test ${test.isActive ? 'activated' : 'deactivated'}`);
  });
});

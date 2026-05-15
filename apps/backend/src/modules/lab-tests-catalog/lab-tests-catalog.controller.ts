import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';

export const listLabTestsCatalog = catchAsync(async (_req: Request, res: Response) => {
  const tests = await prisma.labTestCatalog.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  return successResponse(res, tests, 'Lab tests catalog fetched');
});

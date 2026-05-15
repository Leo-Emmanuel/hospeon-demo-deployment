import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';

const cache = new Map<string, { expiresAt: number; data: unknown }>();
const todayRange = () => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

export const dashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const role = req.user?.role || 'STAFF';
  const cacheKey = `summary:${role}:${req.user?.userId}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return successResponse(res, cached.data, 'Dashboard summary fetched');

  const { start, end } = todayRange();
  const base = {
    patientsToday: await prisma.patient.count({ where: { createdAt: { gte: start, lt: end }, deletedAt: null } }),
    opdVisitsToday: await prisma.visit.count({ where: { visitType: 'OPD', checkedInAt: { gte: start, lt: end } } }),
    pendingLabs: await prisma.labOrder.count({ where: { status: { in: ['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULTED'] } } }),
  };
  let data: unknown = base;
  if (role === 'DOCTOR') {
    data = {
      ...base,
      myQueue: await prisma.visit.count({ where: { doctorId: req.user!.userId, status: { in: ['WAITING', 'IN_CONSULTATION'] }, checkedInAt: { gte: start, lt: end } } }),
      myCompletedToday: await prisma.consultation.count({ where: { doctorId: req.user!.userId, status: 'COMPLETED', updatedAt: { gte: start, lt: end } } }),
      pendingApprovals: await prisma.labOrder.count({ where: { status: 'RESULTED', orderedBy: req.user!.userId } }),
    };
  }
  if (role === 'LAB_TECHNICIAN') {
    data = {
      pendingByPriority: await prisma.labOrder.groupBy({ by: ['priority'], where: { status: { in: ['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING'] } }, _count: true }),
      resultedToday: await prisma.labResult.count({ where: { enteredAt: { gte: start, lt: end } } }),
      approvedToday: await prisma.labResult.count({ where: { approvedAt: { gte: start, lt: end } } }),
    };
  }
  if (role === 'PHARMACIST') {
    const prescriptionsToday = await prisma.prescription.count({
      where: { createdAt: { gte: start, lt: end } },
    });
    const activePrescriptionLines = await prisma.prescription.count({
      where: { isActive: true },
    });
    const distinctPatients = await prisma.prescription.findMany({
      where: { isActive: true },
      distinct: ['patientId'],
      select: { patientId: true },
    });

    data = {
      ...base,
      prescriptionsToday,
      activePrescriptionLines,
      patientsOnActiveMedication: distinctPatients.length,
    };
  }
  cache.set(cacheKey, { expiresAt: Date.now() + 60_000, data });
  return successResponse(res, data, 'Dashboard summary fetched');
});

export const opdQueue = catchAsync(async (_req: Request, res: Response) => {
  const { start, end } = todayRange();
  const queue = await prisma.visit.findMany({ where: { visitType: 'OPD', checkedInAt: { gte: start, lt: end } }, orderBy: { tokenNumber: 'asc' }, include: { patient: true, doctor: { select: { id: true, name: true } }, department: true } });
  return successResponse(res, queue, 'OPD queue fetched');
});

export const labQueue = catchAsync(async (_req: Request, res: Response) => {
  const queue = await prisma.labOrder.findMany({ where: { status: { notIn: ['APPROVED', 'CANCELLED'] } }, orderBy: [{ priority: 'desc' }, { orderedAt: 'asc' }], include: { patient: true, testCatalog: true } });
  return successResponse(res, queue, 'Lab queue fetched');
});

export const doctorWorkload = catchAsync(async (_req: Request, res: Response) => {
  const { start, end } = todayRange();
  const workload = await prisma.consultation.groupBy({ by: ['doctorId'], where: { createdAt: { gte: start, lt: end } }, _count: true });
  return successResponse(res, workload, 'Doctor workload fetched');
});

export const recentActivity = catchAsync(async (_req: Request, res: Response) => {
  const activity = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { actor: { select: { id: true, name: true, role: true } } } });
  return successResponse(res, activity, 'Recent activity fetched');
});

export const pharmacyWorklist = catchAsync(async (_req: Request, res: Response) => {
  const { start, end } = todayRange();
  const worklist = await prisma.prescription.findMany({
    where: {
      isActive: true,
      createdAt: { gte: start, lt: end },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      patient: {
        select: {
          id: true,
          uhid: true,
          firstName: true,
          lastName: true,
        },
      },
      consultation: {
        select: {
          id: true,
          diagnosis: true,
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return successResponse(res, worklist, 'Pharmacy worklist fetched');
});

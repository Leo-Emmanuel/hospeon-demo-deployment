import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { writeAuditLog } from '../../utils/auditLog';

const visitTransitions: Record<string, string[]> = {
  WAITING: ['IN_CONSULTATION', 'CANCELLED'],
  IN_CONSULTATION: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export class VisitsService {
  async create(data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const [patient, doctor, department] = await Promise.all([
        tx.patient.findFirst({ where: { id: data.patientId, deletedAt: null } }),
        tx.user.findFirst({ where: { id: data.doctorId, deletedAt: null, isActive: true } }),
        tx.department.findUnique({ where: { id: data.departmentId } }),
      ]);
      if (!patient) throw new AppError(422, 'A visit must reference an active patient');
      if (!doctor) throw new AppError(422, 'A visit must reference an active doctor');
      if (!department) throw new AppError(422, 'A visit must reference a department');

      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const tokenNumber = (await tx.visit.count({ where: { createdAt: { gte: start }, departmentId: data.departmentId } })) + 1;
      const visit = await tx.visit.create({ data: { ...data, tokenNumber, createdBy: actorId } });
      await writeAuditLog(tx, { actorId, action: 'CREATE', entityType: 'visits', entityId: visit.id, newValues: visit, ipAddress });
      return visit;
    });
  }

  async list(query: any, currentUser?: { userId: string; role: string }) {
    const { page, limit, skip, take } = getPagination(query);
    const start = query.date ? new Date(query.date) : new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const where: Prisma.VisitWhereInput = {
      checkedInAt: { gte: start, lt: end },
      ...(query.status && { status: query.status }),
      ...(query.doctorId && { doctorId: query.doctorId }),
      ...(String(currentUser?.role).toUpperCase() === 'DOCTOR' && { doctorId: currentUser.userId }),
    };
    const [items, total] = await Promise.all([
      prisma.visit.findMany({ where, skip, take, orderBy: [{ tokenNumber: 'asc' }], include: { patient: true, doctor: { select: { id: true, name: true } }, department: true } }),
      prisma.visit.count({ where }),
    ]);
    return { items, meta: getPaginationMeta(page, limit, total) };
  }

  async getById(id: string) {
    const visit = await prisma.visit.findUnique({ where: { id }, include: { patient: true, doctor: { select: { id: true, name: true } }, department: true, consultation: true, labOrders: true } });
    if (!visit) throw new AppError(404, 'Visit not found');
    return visit;
  }

  async update(id: string, data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.visit.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Visit not found');
      const visit = await tx.visit.update({ where: { id }, data });
      await writeAuditLog(tx, { actorId, action: 'UPDATE', entityType: 'visits', entityId: id, oldValues: existing, newValues: visit, ipAddress });
      return visit;
    });
  }

  async updateStatus(id: string, status: string, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.visit.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Visit not found');
      if (!visitTransitions[existing.status].includes(status)) {
        throw new AppError(422, `Invalid visit status transition from ${existing.status} to ${status}`);
      }
      const visit = await tx.visit.update({
        where: { id },
        data: { status: status as any, checkedOutAt: status === 'COMPLETED' ? new Date() : existing.checkedOutAt },
      });
      await writeAuditLog(tx, { actorId, action: 'STATUS_CHANGE', entityType: 'visits', entityId: id, oldValues: existing, newValues: visit, ipAddress });
      return visit;
    });
  }
}

export const visitsService = new VisitsService();

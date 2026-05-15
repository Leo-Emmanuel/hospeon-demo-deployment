import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { writeAuditLog } from '../../utils/auditLog';

const transitions: Record<string, string[]> = {
  PENDING: ['SAMPLE_COLLECTED', 'CANCELLED'],
  SAMPLE_COLLECTED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['RESULTED', 'CANCELLED'],
  RESULTED: ['APPROVED', 'CANCELLED'],
  APPROVED: [],
  CANCELLED: [],
};

export class LabOrdersService {
  async list(query: any) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.LabOrderWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.patientId && { patientId: query.patientId }),
      ...(query.priority && { priority: query.priority }),
    };
    if (query.date) {
      const start = new Date(query.date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.orderedAt = { gte: start, lt: end };
    }
    if (query.category) {
      (where as any).testCatalog = { category: query.category };
    }
    const [items, total] = await Promise.all([
      prisma.labOrder.findMany({ where, skip, take, orderBy: [{ priority: 'desc' }, { orderedAt: 'asc' }], include: { patient: true, testCatalog: true, result: true, orderedByUser: { select: { id: true, name: true } } } }),
      prisma.labOrder.count({ where }),
    ]);
    return { items, meta: getPaginationMeta(page, limit, total) };
  }

  async create(data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const [patient, test] = await Promise.all([
        tx.patient.findFirst({ where: { id: data.patientId, deletedAt: null } }),
        tx.labTestCatalog.findFirst({ where: { id: data.testCatalogId, isActive: true } }),
      ]);
      if (!patient) throw new AppError(422, 'Lab order requires an active patient');
      if (!test) throw new AppError(422, 'Lab order requires an active catalog test');
      if (data.consultationId) {
        const consultation = await tx.consultation.findUnique({ where: { id: data.consultationId } });
        if (!consultation) throw new AppError(422, 'Lab order consultation does not exist');
      }
      if (data.visitId) {
        const visit = await tx.visit.findUnique({ where: { id: data.visitId } });
        if (!visit) throw new AppError(422, 'Lab order visit does not exist');
      }
      const labOrder = await tx.labOrder.create({ data: { ...data, orderedBy: actorId! } });
      await writeAuditLog(tx, { actorId, action: 'CREATE', entityType: 'lab_orders', entityId: labOrder.id, newValues: labOrder, ipAddress });
      return labOrder;
    });
  }

  async getById(id: string) {
    const order = await prisma.labOrder.findUnique({ where: { id }, include: { patient: true, testCatalog: true, result: true, orderedByUser: { select: { id: true, name: true } } } });
    if (!order) throw new AppError(404, 'Lab order not found');
    return order;
  }

  async updateStatus(id: string, status: string, actorRole?: string, actorId?: string, ipAddress?: string, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.labOrder.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Lab order not found');
      if (status === 'CANCELLED' && !['ADMIN', 'DOCTOR'].includes(actorRole || '')) {
        throw new AppError(403, 'Only admin or doctor can cancel lab orders');
      }
      if (!transitions[existing.status].includes(status)) {
        throw new AppError(422, `Invalid lab order status transition from ${existing.status} to ${status}`);
      }
      const order = await tx.labOrder.update({ where: { id }, data: { status: status as any, ...(notes && { notes }) } });
      await writeAuditLog(tx, { actorId, action: 'STATUS_CHANGE', entityType: 'lab_orders', entityId: id, oldValues: existing, newValues: order, ipAddress });
      return order;
    });
  }

  cancel(id: string, actorRole?: string, actorId?: string, ipAddress?: string) {
    return this.updateStatus(id, 'CANCELLED', actorRole, actorId, ipAddress);
  }
}

export const labOrdersService = new LabOrdersService();

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { generateUhid } from '../../utils/uhid';
import { writeAuditLog } from '../../utils/auditLog';

export class PatientsService {
  async list(query: any) {
    const { page, limit, skip, take } = getPagination(query);
    const visitFrom = query.visitFrom ? new Date(query.visitFrom) : undefined;
    const visitTo = query.visitTo ? new Date(query.visitTo) : undefined;
    const followUpDate = query.followUpDate ? new Date(query.followUpDate) : undefined;
    const followUpDateEnd = followUpDate ? new Date(followUpDate) : undefined;
    if (followUpDateEnd) {
      followUpDateEnd.setUTCDate(followUpDateEnd.getUTCDate() + 1);
    }
    const sortFieldMap: Record<string, Prisma.PatientOrderByWithRelationInput> = {
      createdAt: { createdAt: query.order || 'desc' },
      updatedAt: { updatedAt: query.order || 'desc' },
      firstName: { firstName: query.order || 'asc' },
      lastName: { lastName: query.order || 'asc' },
      uhid: { uhid: query.order || 'asc' },
    };
    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(query.gender && { gender: query.gender }),
      ...(query.bloodGroup && { bloodGroup: query.bloodGroup }),
      ...((visitFrom || visitTo) && {
        visits: {
          some: {
            ...(visitFrom || visitTo
              ? {
                  checkedInAt: {
                    ...(visitFrom ? { gte: visitFrom } : {}),
                    ...(visitTo ? { lte: visitTo } : {}),
                  },
                }
              : {}),
          },
        },
      }),
      ...(followUpDate && followUpDateEnd && {
        consultations: {
          some: {
            followUpDate: {
              gte: followUpDate,
              lt: followUpDateEnd,
            },
          },
        },
      }),
      ...(query.search && {
        OR: [
          { uhid: { contains: query.search, mode: 'insensitive' } },
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: sortFieldMap[query.sort] || sortFieldMap.createdAt,
        include: {
          visits: {
            orderBy: { checkedInAt: 'desc' },
            take: 1,
            include: {
              doctor: {
                select: { id: true, name: true },
              },
              department: true,
            },
          },
          prescriptions: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);
    return { items, meta: getPaginationMeta(page, limit, total) };
  }

  async create(data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          ...data,
          dob: new Date(data.dob),
          uhid: await generateUhid(tx),
          createdBy: actorId,
        },
      });
      await writeAuditLog(tx, { actorId, action: 'CREATE', entityType: 'patients', entityId: patient.id, newValues: patient, ipAddress });
      return patient;
    });
  }

  async getById(id: string) {
    const patient = await prisma.patient.findFirst({
      where: { id, deletedAt: null },
      include: {
        visits: { orderBy: { checkedInAt: 'desc' }, take: 10, include: { doctor: { select: { id: true, name: true } }, department: true } },
        consultations: { orderBy: { createdAt: 'desc' }, take: 10 },
        prescriptions: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
        labOrders: { orderBy: { orderedAt: 'desc' }, take: 10, include: { testCatalog: true, result: true } },
      },
    });
    if (!patient) throw new AppError(404, 'Patient not found');
    return patient;
  }

  async update(id: string, data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.patient.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'Patient not found');
      const patient = await tx.patient.update({ where: { id }, data });
      await writeAuditLog(tx, { actorId, action: 'UPDATE', entityType: 'patients', entityId: id, oldValues: existing, newValues: patient, ipAddress });
      return patient;
    });
  }

  async softDelete(id: string, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.patient.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'Patient not found');
      const patient = await tx.patient.update({ where: { id }, data: { deletedAt: new Date() } });
      await writeAuditLog(tx, { actorId, action: 'DELETE', entityType: 'patients', entityId: id, oldValues: existing, newValues: patient, ipAddress });
      return patient;
    });
  }

  visits(id: string) {
    return prisma.visit.findMany({ where: { patientId: id }, orderBy: { checkedInAt: 'desc' }, include: { doctor: { select: { id: true, name: true } }, department: true } });
  }

  consultations(id: string) {
    return prisma.consultation.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' }, include: { prescriptions: true } });
  }

  labOrders(id: string) {
    return prisma.labOrder.findMany({ where: { patientId: id }, orderBy: { orderedAt: 'desc' }, include: { testCatalog: true, result: true } });
  }

  prescriptions(id: string) {
    return prisma.prescription.findMany({ where: { patientId: id, isActive: true }, orderBy: { createdAt: 'desc' } });
  }
}

export const patientsService = new PatientsService();

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { generateUhid } from '../../utils/uhid';
import { writeAuditLog } from '../../utils/auditLog';
import { patientsRepository } from './patients.repository';

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
      ...(query.userId && { userId: query.userId }),
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
      patientsRepository.findAll(
        where,
        skip,
        take,
        sortFieldMap[query.sort] || sortFieldMap.createdAt,
        {
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
        }
      ),
      patientsRepository.count(where),
    ]);
    return { items, meta: getPaginationMeta(page, limit, total) };
  }

  async create(data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      if (data.userId) {
        const user = await tx.user.findFirst({ where: { id: data.userId, deletedAt: null } });
        if (!user) throw new AppError(422, 'Linked user not found');
        if (user.userCategory !== 'PATIENT') throw new AppError(422, 'Linked user must be a patient');
      }
      const patient = await patientsRepository.create({
        ...data,
        dob: new Date(data.dob),
        uhid: await generateUhid(tx),
        createdBy: actorId,
      }, tx);
      await writeAuditLog(tx, { actorId, action: 'CREATE', entityType: 'patients', entityId: patient.id, newValues: patient, ipAddress });
      return patient;
    });
  }

  async getById(id: string) {
    const patient = await patientsRepository.findById(id);
    if (!patient) throw new AppError(404, 'Patient not found');
    return patient;
  }

  async update(id: string, data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.patient.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'Patient not found');
      if (data.userId) {
        const user = await tx.user.findFirst({ where: { id: data.userId, deletedAt: null } });
        if (!user) throw new AppError(422, 'Linked user not found');
        if (user.userCategory !== 'PATIENT') throw new AppError(422, 'Linked user must be a patient');
      }
      const patient = await patientsRepository.update(id, data, tx);
      await writeAuditLog(tx, { actorId, action: 'UPDATE', entityType: 'patients', entityId: id, oldValues: existing, newValues: patient, ipAddress });
      return patient;
    });
  }

  async softDelete(id: string, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.patient.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'Patient not found');
      const patient = await patientsRepository.softDelete(id, tx);
      await writeAuditLog(tx, { actorId, action: 'DELETE', entityType: 'patients', entityId: id, oldValues: existing, newValues: patient, ipAddress });
      return patient;
    });
  }

  visits(id: string) {
    return patientsRepository.findVisits(id);
  }

  consultations(id: string) {
    return patientsRepository.findConsultations(id);
  }

  labOrders(id: string) {
    return patientsRepository.findLabOrders(id);
  }

  prescriptions(id: string) {
    return patientsRepository.findPrescriptions(id);
  }
}

export const patientsService = new PatientsService();

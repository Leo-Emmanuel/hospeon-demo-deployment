import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class PatientsRepository {
  async findAll(where: Prisma.PatientWhereInput, skip?: number, take?: number, orderBy?: Prisma.PatientOrderByWithRelationInput, include?: Prisma.PatientInclude) {
    return prisma.patient.findMany({
      where,
      skip,
      take,
      orderBy,
      include,
    });
  }

  async count(where: Prisma.PatientWhereInput) {
    return prisma.patient.count({ where });
  }

  async findById(id: string, include?: Prisma.PatientInclude) {
    return prisma.patient.findFirst({
      where: { id, deletedAt: null },
      include: include || {
        visits: { orderBy: { checkedInAt: 'desc' }, take: 10, include: { doctor: { select: { id: true, name: true } }, department: true } },
        consultations: { orderBy: { createdAt: 'desc' }, take: 10 },
        prescriptions: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
        labOrders: { orderBy: { orderedAt: 'desc' }, take: 10, include: { testCatalog: true, result: true } },
      },
    });
  }

  async findByUhid(uhid: string) {
    return prisma.patient.findFirst({
      where: { uhid, deletedAt: null },
    });
  }

  async create(data: Prisma.PatientCreateInput | Prisma.PatientUncheckedCreateInput, tx?: any) {
    const client = tx || prisma;
    return client.patient.create({ data });
  }

  async update(id: string, data: Prisma.PatientUpdateInput | Prisma.PatientUncheckedUpdateInput, tx?: any) {
    const client = tx || prisma;
    return client.patient.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, tx?: any) {
    const client = tx || prisma;
    return client.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findVisits(patientId: string) {
    return prisma.visit.findMany({
      where: { patientId },
      orderBy: { checkedInAt: 'desc' },
      include: { doctor: { select: { id: true, name: true } }, department: true }
    });
  }

  async findConsultations(patientId: string) {
    return prisma.consultation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { prescriptions: true }
    });
  }

  async findLabOrders(patientId: string) {
    return prisma.labOrder.findMany({
      where: { patientId },
      orderBy: { orderedAt: 'desc' },
      include: { testCatalog: true, result: true }
    });
  }

  async findPrescriptions(patientId: string) {
    return prisma.prescription.findMany({
      where: { patientId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const patientsRepository = new PatientsRepository();

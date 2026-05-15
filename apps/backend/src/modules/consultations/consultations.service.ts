import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { writeAuditLog } from '../../utils/auditLog';

export class ConsultationsService {
  async create(data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({ where: { id: data.visitId } });
      if (!visit) throw new AppError(404, 'Visit not found');
      if (visit.status !== 'IN_CONSULTATION') {
        throw new AppError(422, 'A consultation can only be created for a visit in in_consultation status');
      }
      const consultation = await tx.consultation.create({
        data: {
          visitId: visit.id,
          patientId: visit.patientId,
          doctorId: visit.doctorId,
          departmentId: visit.departmentId,
          diagnosis: data.diagnosis,
          diagnosisCode: data.diagnosisCode,
          clinicalNotes: data.clinicalNotes,
          followUpDate: data.followUpDate,
        },
      });
      await writeAuditLog(tx, { actorId, action: 'CREATE', entityType: 'consultations', entityId: consultation.id, newValues: consultation, ipAddress });
      return consultation;
    });
  }

  async getById(id: string) {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: { visit: true, patient: true, doctor: { select: { id: true, name: true } }, prescriptions: true, labOrders: { include: { testCatalog: true, result: true } } },
    });
    if (!consultation) throw new AppError(404, 'Consultation not found');
    return consultation;
  }

  async update(id: string, data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.consultation.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Consultation not found');
      if (existing.status === 'COMPLETED') throw new AppError(422, 'Completed consultations cannot be edited');
      const consultation = await tx.consultation.update({ where: { id }, data });
      await writeAuditLog(tx, { actorId, action: 'UPDATE', entityType: 'consultations', entityId: id, oldValues: existing, newValues: consultation, ipAddress });
      return consultation;
    });
  }

  async complete(id: string, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.consultation.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Consultation not found');
      const consultation = await tx.consultation.update({ where: { id }, data: { status: 'COMPLETED' } });
      await tx.visit.update({ where: { id: consultation.visitId }, data: { status: 'COMPLETED', checkedOutAt: new Date() } });
      await writeAuditLog(tx, { actorId, action: 'COMPLETE', entityType: 'consultations', entityId: id, oldValues: existing, newValues: consultation, ipAddress });
      return consultation;
    });
  }
}

export const consultationsService = new ConsultationsService();

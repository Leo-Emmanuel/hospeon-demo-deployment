import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { writeAuditLog } from '../../utils/auditLog';

export class PrescriptionsService {
  async bulkCreate(data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.findUnique({ where: { id: data.consultationId } });
      if (!consultation) throw new AppError(404, 'Consultation not found');
      const prescriptions = await Promise.all(data.prescriptions.map((item: any) => tx.prescription.create({
        data: { ...item, consultationId: consultation.id, patientId: consultation.patientId },
      })));
      await writeAuditLog(tx, { actorId, action: 'CREATE', entityType: 'prescriptions', entityId: consultation.id, newValues: prescriptions, ipAddress });
      return prescriptions;
    });
  }

  listByConsultation(consultationId: string) {
    return prisma.prescription.findMany({ where: { consultationId }, orderBy: { createdAt: 'desc' } });
  }

  async deactivate(id: string, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.prescription.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Prescription not found');
      const prescription = await tx.prescription.update({ where: { id }, data: { isActive: false } });
      await writeAuditLog(tx, { actorId, action: 'DEACTIVATE', entityType: 'prescriptions', entityId: id, oldValues: existing, newValues: prescription, ipAddress });
      return prescription;
    });
  }
}

export const prescriptionsService = new PrescriptionsService();

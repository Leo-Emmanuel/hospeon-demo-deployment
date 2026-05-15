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

  async completeVisit(
    data: {
      visitId: string;
      diagnosis?: string;
      diagnosisCode?: string;
      clinicalNotes?: string;
      followUpDate?: Date;
      prescriptions: Array<{
        drugName: string;
        dosage: string;
        frequency: string;
        durationDays: number;
        route?: string;
        instructions?: string;
      }>;
      labOrders: Array<{
        testCatalogId: string;
        priority: 'ROUTINE' | 'URGENT' | 'STAT';
        notes?: string;
      }>;
    },
    actorId?: string,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Validate visit exists and is IN_CONSULTATION
      const visit = await tx.visit.findUnique({ where: { id: data.visitId } });
      if (!visit) throw new AppError(404, 'Visit not found');
      if (visit.status !== 'IN_CONSULTATION') {
        throw new AppError(422, `Visit is in '${visit.status}' status - must be IN_CONSULTATION to complete`);
      }

      // Guard: reject if a consultation already exists for this visit
      const existing = await tx.consultation.findUnique({ where: { visitId: data.visitId } });
      if (existing) {
        throw new AppError(422, 'A consultation already exists for this visit');
      }

      // 2. Create the consultation record
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

      // 3. Bulk-create prescriptions (single round-trip)
      let prescriptions: any[] = [];
      if (data.prescriptions.length > 0) {
        await tx.prescription.createMany({
          data: data.prescriptions.map((rx) => ({
            consultationId: consultation.id,
            visitId: visit.id,
            patientId: visit.patientId,
            drugName: rx.drugName,
            dosage: rx.dosage,
            frequency: rx.frequency,
            durationDays: rx.durationDays,
            route: rx.route,
            instructions: rx.instructions,
          })),
        });
        prescriptions = await tx.prescription.findMany({ where: { consultationId: consultation.id } });
      }

      // 4. Create lab orders (parallel inside the transaction)
      let labOrders: any[] = [];
      if (data.labOrders.length > 0) {
        labOrders = await Promise.all(
          data.labOrders.map((order) =>
            tx.labOrder.create({
              data: {
                consultationId: consultation.id,
                visitId: visit.id,
                patientId: visit.patientId,
                orderedBy: actorId || visit.doctorId,
                testCatalogId: order.testCatalogId,
                priority: order.priority,
                notes: order.notes,
              },
            })
          )
        );
      }

      // 5. Mark consultation COMPLETED
      const completedConsultation = await tx.consultation.update({
        where: { id: consultation.id },
        data: { status: 'COMPLETED' },
      });

      // 6. Mark visit COMPLETED and set checkedOutAt
      await tx.visit.update({
        where: { id: visit.id },
        data: { status: 'COMPLETED', checkedOutAt: new Date() },
      });

      // 7. Single audit log entry
      await writeAuditLog(tx, {
        actorId,
        action: 'COMPLETE_VISIT',
        entityType: 'consultations',
        entityId: consultation.id,
        newValues: {
          consultationId: consultation.id,
          prescriptionCount: prescriptions.length,
          labOrderCount: labOrders.length,
        },
        ipAddress,
      });

      return { consultation: completedConsultation, prescriptions, labOrders };
    });
  }
}

export const consultationsService = new ConsultationsService();

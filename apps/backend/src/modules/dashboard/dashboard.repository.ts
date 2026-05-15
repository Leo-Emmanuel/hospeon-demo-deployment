import { prisma } from '../../lib/prisma';

export class DashboardRepository {
  async countPatients(where: any) {
    return prisma.patient.count({ where: { ...where, deletedAt: null } });
  }

  async countVisits(where: any) {
    return prisma.visit.count({ where });
  }

  async countLabOrders(where: any) {
    return prisma.labOrder.count({ where });
  }

  async countConsultations(where: any) {
    return prisma.consultation.count({ where });
  }

  async countLabResults(where: any) {
    return prisma.labResult.count({ where });
  }

  async countPrescriptions(where: any) {
    return prisma.prescription.count({ where });
  }

  async groupLabOrdersByPriority(where: any) {
    return prisma.labOrder.groupBy({ by: ['priority'], where, _count: true });
  }

  async getPrescriptionPatients(where: any) {
    return prisma.prescription.findMany({
      where,
      distinct: ['patientId'],
      select: { patientId: true },
    });
  }

  async getOpdQueue(start: Date, end: Date) {
    return prisma.visit.findMany({
      where: { visitType: 'OPD', checkedInAt: { gte: start, lt: end } },
      orderBy: { tokenNumber: 'asc' },
      include: { patient: true, doctor: { select: { id: true, name: true } }, department: true }
    });
  }

  async getLabQueue() {
    return prisma.labOrder.findMany({
      where: { status: { notIn: ['APPROVED', 'CANCELLED'] } },
      orderBy: [{ priority: 'desc' }, { orderedAt: 'asc' }],
      include: { patient: true, testCatalog: true }
    });
  }

  async getDoctorWorkloadRaw(start: Date, end: Date) {
    return prisma.$queryRaw<Array<{ doctorId: string; doctorName: string; consultationCount: bigint }>>`
      SELECT
        c.doctor_id AS "doctorId",
        u.name AS "doctorName",
        COUNT(c.id)::bigint AS "consultationCount"
      FROM consultations c
      INNER JOIN users u ON u.id = c.doctor_id
      WHERE c.created_at >= ${start}
        AND c.created_at < ${end}
        AND u.deleted_at IS NULL
      GROUP BY c.doctor_id, u.name
      ORDER BY COUNT(c.id) DESC, u.name ASC
    `;
  }

  async getRecentActivity() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actor: { select: { id: true, name: true, role: true } } }
    });
  }

  async getPharmacyWorklist(start: Date, end: Date) {
    return prisma.prescription.findMany({
      where: {
        isActive: true,
        createdAt: { gte: start, lt: end },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        consultation: {
          select: {
            id: true,
            diagnosis: true,
            doctor: { select: { id: true, name: true } },
          },
        },
      },
    });
  }
}

export const dashboardRepository = new DashboardRepository();

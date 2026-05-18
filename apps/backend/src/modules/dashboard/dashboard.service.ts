import { DashboardDay } from './dashboard.types';
import { dashboardRepository } from './dashboard.repository';

const cache = new Map<string, { expiresAt: number; data: unknown }>();

const dayRange = (day: DashboardDay = 'today') => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  if (day === 'yesterday') {
    start.setUTCDate(start.getUTCDate() - 1);
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

export class DashboardService {
  async getSummary(role: string, userId: string, requestedDay: 'today' | 'yesterday'): Promise<unknown> {
    const cacheKey = `summary:${role}:${userId}:${requestedDay}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const { start, end } = dayRange(requestedDay);
    const base = {
      patientsToday: await dashboardRepository.countPatients({ createdAt: { gte: start, lt: end } }),
      opdVisitsToday: await dashboardRepository.countVisits({ visitType: 'OPD', checkedInAt: { gte: start, lt: end } }),
      pendingLabs: await dashboardRepository.countLabOrders({
        status: { in: ['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULTED'] },
        orderedAt: { gte: start, lt: end },
      }),
      admissionsToday: await dashboardRepository.countVisits({ visitType: 'IPD', checkedInAt: { gte: start, lt: end } }),
    };
    let data: unknown = base;

    if (String(role).toUpperCase() === 'DOCTOR') {
      data = {
        ...base,
        myQueue: await dashboardRepository.countVisits({ doctorId: userId, status: { in: ['WAITING', 'IN_CONSULTATION'] }, checkedInAt: { gte: start, lt: end } }),
        myCompletedToday: await dashboardRepository.countConsultations({ doctorId: userId, status: 'COMPLETED', updatedAt: { gte: start, lt: end } }),
        pendingApprovals: await dashboardRepository.countLabOrders({ status: 'RESULTED', orderedBy: userId }),
      };
    }
    if (String(role).toUpperCase() === 'LAB_TECHNICIAN') {
      data = {
        pendingByPriority: await dashboardRepository.groupLabOrdersByPriority({ status: { in: ['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING'] } }),
        resultedToday: await dashboardRepository.countLabResults({ enteredAt: { gte: start, lt: end } }),
        approvedToday: await dashboardRepository.countLabResults({ approvedAt: { gte: start, lt: end } }),
      };
    }
    if (String(role).toUpperCase() === 'PHARMACIST') {
      const prescriptionsToday = await dashboardRepository.countPrescriptions({
        createdAt: { gte: start, lt: end },
      });
      const activePrescriptionLines = await dashboardRepository.countPrescriptions({
        isActive: true,
      });
      const distinctPatients = await dashboardRepository.getPrescriptionPatients({ isActive: true });

      data = {
        ...base,
        prescriptionsToday,
        activePrescriptionLines,
        patientsOnActiveMedication: distinctPatients.length,
      };
    }

    cache.set(cacheKey, { expiresAt: Date.now() + 60_000, data });
    return data;
  }

  async getOpdQueue(): Promise<unknown> {
    const { start, end } = dayRange();
    return dashboardRepository.getOpdQueue(start, end);
  }

  async getLabQueue(): Promise<unknown> {
    return dashboardRepository.getLabQueue();
  }

  async getDoctorWorkload(): Promise<unknown> {
    const { start, end } = dayRange();
    const workload = await dashboardRepository.getDoctorWorkloadRaw(start, end);
    return workload.map((item) => ({
      doctorId: item.doctorId,
      doctorName: item.doctorName,
      consultationCount: Number(item.consultationCount),
    }));
  }

  async getRecentActivity(): Promise<unknown> {
    return dashboardRepository.getRecentActivity();
  }

  async getPharmacyWorklist(): Promise<unknown> {
    const { start, end } = dayRange();
    return dashboardRepository.getPharmacyWorklist(start, end);
  }
}

export const dashboardService = new DashboardService();

import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/services/patientService';
import { VisitRecord } from '@/services/visitService';
import { LabOrderRecord } from '@/services/labService';

export interface AdminDashboardSummary {
  patientsToday: number;
  opdVisitsToday: number;
  pendingLabs: number;
  admissionsToday: number;
}

export interface DoctorDashboardSummary extends AdminDashboardSummary {
  myQueue: number;
  myCompletedToday: number;
  pendingApprovals: number;
}

export interface LabDashboardSummary {
  pendingByPriority: Array<{
    priority: 'ROUTINE' | 'URGENT' | 'STAT';
    _count: number;
  }>;
  resultedToday: number;
  approvedToday: number;
}

export interface PharmacyDashboardSummary extends AdminDashboardSummary {
  prescriptionsToday: number;
  activePrescriptionLines: number;
  patientsOnActiveMedication: number;
}

export interface DoctorWorkloadItem {
  doctorId: string;
  doctorName: string;
  consultationCount: number;
}

export interface DashboardSummaryParams {
  day?: 'today' | 'yesterday';
}

export interface AuditActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export interface PharmacyWorkItem {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route?: string | null;
  instructions?: string | null;
  createdAt: string;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
  };
  consultation: {
    id: string;
    diagnosis?: string | null;
    doctor: {
      id: string;
      name: string;
    };
  };
}

export const dashboardService = {
  getSummary: async (
    params: DashboardSummaryParams = {}
  ): Promise<ApiResponse<AdminDashboardSummary | DoctorDashboardSummary | LabDashboardSummary | PharmacyDashboardSummary>> =>
    apiClient.get('/dashboard/summary', { params }),
  getOpdQueue: async (): Promise<ApiResponse<VisitRecord[]>> => apiClient.get('/dashboard/opd-queue'),
  getLabQueue: async (): Promise<ApiResponse<LabOrderRecord[]>> => apiClient.get('/dashboard/lab-queue'),
  getPharmacyWorklist: async (): Promise<ApiResponse<PharmacyWorkItem[]>> => apiClient.get('/dashboard/pharmacy-worklist'),
  getDoctorWorkload: async (): Promise<ApiResponse<DoctorWorkloadItem[]>> => apiClient.get('/dashboard/doctor-workload'),
  getRecentActivity: async (): Promise<ApiResponse<AuditActivityItem[]>> => apiClient.get('/dashboard/recent-activity'),
};

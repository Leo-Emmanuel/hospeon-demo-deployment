import { apiClient } from '@/lib/axios';
import { ApiMeta, ApiResponse, PatientSummary } from '@/services/patientService';

export type VisitStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
export type VisitType = 'OPD' | 'IPD' | 'EMERGENCY';

export interface VisitRecord {
  id: string;
  patientId: string;
  visitType: VisitType;
  doctorId: string;
  departmentId: string;
  tokenNumber: number;
  status: VisitStatus;
  chiefComplaint?: string | null;
  vitals?: Record<string, unknown> | null;
  checkedInAt: string;
  checkedOutAt?: string | null;
  patient: PatientSummary;
  doctor?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  consultation?: {
    id: string;
    status: 'DRAFT' | 'COMPLETED';
  } | null;
  labOrders?: Array<{
    id: string;
    status: string;
  }>;
}

export interface VisitListParams {
  page?: number;
  limit?: number;
  status?: VisitStatus;
  doctorId?: string;
  date?: string;
  search?: string;
}

export const visitService = {
  list: async (params: VisitListParams = {}): Promise<ApiResponse<VisitRecord[]>> =>
    apiClient.get('/visits', { params }),
  getById: async (id: string): Promise<ApiResponse<VisitRecord>> => apiClient.get(`/visits/${id}`),
  updateStatus: async (id: string, status: VisitStatus): Promise<ApiResponse<VisitRecord>> =>
    apiClient.patch(`/visits/${id}/status`, { status }),
  update: async (
    id: string,
    payload: { chiefComplaint?: string; vitals?: Record<string, unknown> }
  ): Promise<ApiResponse<VisitRecord>> => apiClient.put(`/visits/${id}`, payload),
  create: async (payload: {
    patientId: string;
    visitType: VisitType;
    doctorId: string;
    departmentId: string;
    chiefComplaint?: string;
    vitals?: Record<string, unknown>;
  }): Promise<ApiResponse<VisitRecord>> => apiClient.post('/visits', payload),
};

export type VisitListResponseMeta = ApiMeta;

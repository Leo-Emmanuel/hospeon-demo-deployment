import { apiClient } from '@/lib/axios';
import { ApiMeta, ApiResponse, LabOrderSummary } from '@/services/patientService';

export interface LabOrderRecord extends LabOrderSummary {
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dob: string;
  };
  orderedByUser?: {
    id: string;
    name: string;
  };
  testCatalog: {
    id: string;
    name: string;
    code: string;
    category?: string | null;
    specimenType?: string | null;
    referenceRangeLow?: string | null;
    referenceRangeHigh?: string | null;
    unit?: string | null;
    turnaroundHours?: number | null;
  };
}

export interface LabResultRecord {
  id: string;
  labOrderId: string;
  resultValue: string;
  resultUnit?: string | null;
  referenceRange?: string | null;
  isAbnormal: boolean;
  technicianId: string;
  enteredAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  reportFileUrl?: string | null;
  notes?: string | null;
  labOrder: LabOrderRecord;
  technician?: {
    id: string;
    name: string;
  };
  approver?: {
    id: string;
    name: string;
  } | null;
}

export interface LabOrderListParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTED' | 'APPROVED' | 'CANCELLED';
  priority?: 'ROUTINE' | 'URGENT' | 'STAT';
  patientId?: string;
  date?: string;
}

export interface UpsertLabResultPayload {
  resultValue: string;
  resultUnit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  reportFileUrl?: string;
  notes?: string;
}

export const labService = {
  listOrders: async (params: LabOrderListParams = {}): Promise<ApiResponse<LabOrderRecord[]>> =>
    apiClient.get('/lab-orders', { params }),
  getOrder: async (id: string): Promise<ApiResponse<LabOrderRecord>> => apiClient.get(`/lab-orders/${id}`),
  updateOrderStatus: async (
    id: string,
    status: 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTED' | 'APPROVED' | 'CANCELLED'
  ): Promise<ApiResponse<LabOrderRecord>> => apiClient.patch(`/lab-orders/${id}/status`, { status }),
  getResult: async (orderId: string): Promise<ApiResponse<LabResultRecord>> => apiClient.get(`/lab-results/${orderId}`),
  enterResult: async (orderId: string, payload: UpsertLabResultPayload): Promise<ApiResponse<LabResultRecord>> =>
    apiClient.post(`/lab-results/${orderId}`, payload),
  updateResult: async (orderId: string, payload: UpsertLabResultPayload): Promise<ApiResponse<LabResultRecord>> =>
    apiClient.put(`/lab-results/${orderId}`, payload),
  approveResult: async (orderId: string): Promise<ApiResponse<LabResultRecord>> =>
    apiClient.patch(`/lab-results/${orderId}/approve`),
};

export type LabOrderListMeta = ApiMeta;

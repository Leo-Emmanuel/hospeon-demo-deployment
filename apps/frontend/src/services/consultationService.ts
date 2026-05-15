import { apiClient } from '@/lib/axios';
import { ApiResponse, ConsultationSummary, LabOrderSummary, Prescription } from '@/services/patientService';
import { VisitRecord } from '@/services/visitService';

export interface ConsultationRecord extends ConsultationSummary {
  visit: VisitRecord;
  patient: VisitRecord['patient'];
  doctor?: {
    id: string;
    name: string;
  };
  labOrders: LabOrderSummary[];
  prescriptions: Prescription[];
}

export interface ConsultationPayload {
  visitId: string;
  diagnosis?: string;
  diagnosisCode?: string;
  clinicalNotes?: string;
  followUpDate?: string;
}

export interface PrescriptionPayload {
  drugName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route?: string;
  instructions?: string;
}

export interface LabOrderPayload {
  visitId: string;
  consultationId: string;
  patientId: string;
  testCatalogId: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  notes?: string;
}

export interface LabTestCatalogItem {
  id: string;
  name: string;
  code: string;
  category?: string | null;
  unit?: string | null;
  turnaroundHours?: number | null;
}

export const consultationService = {
  create: async (payload: ConsultationPayload): Promise<ApiResponse<ConsultationRecord>> =>
    apiClient.post('/consultations', payload),
  getById: async (id: string): Promise<ApiResponse<ConsultationRecord>> => apiClient.get(`/consultations/${id}`),
  update: async (id: string, payload: Omit<ConsultationPayload, 'visitId'>): Promise<ApiResponse<ConsultationRecord>> =>
    apiClient.put(`/consultations/${id}`, payload),
  complete: async (id: string): Promise<ApiResponse<ConsultationRecord>> =>
    apiClient.patch(`/consultations/${id}/complete`),
  createPrescriptions: async (
    consultationId: string,
    prescriptions: PrescriptionPayload[]
  ): Promise<ApiResponse<Prescription[]>> =>
    apiClient.post('/prescriptions', { consultationId, prescriptions }),
  getPrescriptions: async (consultationId: string): Promise<ApiResponse<Prescription[]>> =>
    apiClient.get(`/prescriptions/${consultationId}`),
  createLabOrder: async (payload: LabOrderPayload): Promise<ApiResponse<LabOrderSummary>> =>
    apiClient.post('/lab-orders', payload),
  getLabTestsCatalog: async (): Promise<ApiResponse<LabTestCatalogItem[]>> =>
    apiClient.get('/lab-tests-catalog'),
};

import { apiClient } from '@/lib/axios';

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: ApiMeta;
}

export interface PatientAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface InsuranceInfo {
  provider?: string;
  policyNumber?: string;
  memberId?: string;
  planName?: string;
}

export interface Prescription {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route?: string | null;
  instructions?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface VisitSummary {
  id: string;
  visitType: 'OPD' | 'IPD' | 'EMERGENCY';
  tokenNumber: number;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  chiefComplaint?: string | null;
  vitals?: Record<string, unknown> | null;
  checkedInAt: string;
  checkedOutAt?: string | null;
  doctor?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  } | null;
}

export interface ConsultationSummary {
  id: string;
  diagnosis?: string | null;
  diagnosisCode?: string | null;
  clinicalNotes?: string | null;
  followUpDate?: string | null;
  status: 'DRAFT' | 'COMPLETED';
  createdAt: string;
  prescriptions?: Prescription[];
}

export interface LabResultSummary {
  id: string;
  resultValue: string;
  resultUnit?: string | null;
  referenceRange?: string | null;
  isAbnormal: boolean;
  approvedAt?: string | null;
}

export interface LabOrderSummary {
  id: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  status: 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTED' | 'APPROVED' | 'CANCELLED';
  orderedAt: string;
  notes?: string | null;
  testCatalog?: {
    id: string;
    name: string;
    code: string;
    unit?: string | null;
  };
  result?: LabResultSummary | null;
}

export interface PatientSummary {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: PatientAddress | null;
  emergencyContact?: EmergencyContact | null;
  insuranceInfo?: InsuranceInfo | null;
  createdAt: string;
  updatedAt: string;
  visits?: VisitSummary[];
  prescriptions?: Prescription[];
}

export interface PatientDetail extends PatientSummary {
  consultations: ConsultationSummary[];
  labOrders: LabOrderSummary[];
}

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  visitFrom?: string;
  visitTo?: string;
}

export interface CreatePatientPayload {
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  phone?: string;
  email?: string;
  address?: PatientAddress;
  emergencyContact?: EmergencyContact;
  insuranceInfo?: InsuranceInfo;
  departmentId?: string;
}

export type UpdatePatientPayload = Partial<CreatePatientPayload>;

export const patientService = {
  list: async (params: PatientListParams = {}): Promise<ApiResponse<PatientSummary[]>> =>
    apiClient.get('/patients', { params }),
  getById: async (id: string): Promise<ApiResponse<PatientDetail>> => apiClient.get(`/patients/${id}`),
  create: async (payload: CreatePatientPayload): Promise<ApiResponse<PatientDetail>> =>
    apiClient.post('/patients', payload),
  update: async (id: string, payload: UpdatePatientPayload): Promise<ApiResponse<PatientDetail>> =>
    apiClient.put(`/patients/${id}`, payload),
  remove: async (id: string): Promise<ApiResponse<PatientDetail>> => apiClient.delete(`/patients/${id}`),
  getVisits: async (id: string): Promise<ApiResponse<VisitSummary[]>> => apiClient.get(`/patients/${id}/visits`),
  getConsultations: async (id: string): Promise<ApiResponse<ConsultationSummary[]>> =>
    apiClient.get(`/patients/${id}/consultations`),
  getLabOrders: async (id: string): Promise<ApiResponse<LabOrderSummary[]>> =>
    apiClient.get(`/patients/${id}/lab-orders`),
  getPrescriptions: async (id: string): Promise<ApiResponse<Prescription[]>> =>
    apiClient.get(`/patients/${id}/prescriptions`),
};

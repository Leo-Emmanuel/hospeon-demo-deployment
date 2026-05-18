import { apiClient } from '@/lib/axios';
import { ApiMeta, ApiResponse } from '@/services/patientService';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentType = 'NEW_CONSULTATION' | 'FOLLOW_UP' | 'PROCEDURE' | 'VACCINATION';
export type ConsultationMode = 'IN_PERSON' | 'TELEMED';

export interface AppointmentRecord {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  status: AppointmentStatus;
  appointmentType?: AppointmentType | null;
  consultationMode?: ConsultationMode | null;
  source: 'STAFF' | 'PATIENT';
  reason?: string | null;
  symptoms?: string | null;
  notes?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isEmergency: boolean;
  startAt: string;
  endAt: string;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    phone?: string | null;
  };
  doctor?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
}

export interface AppointmentListParams {
  status?: AppointmentStatus;
  doctorId?: string;
  patientId?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentSlot {
  startAt: string;
  endAt: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  bookedCount: number;
  capacity: number;
}

export interface CreateAppointmentPayload {
  patientId?: string;
  doctorId: string;
  departmentId: string;
  appointmentType?: AppointmentType;
  consultationMode?: ConsultationMode;
  reason?: string;
  symptoms?: string;
  notes?: string;
  isEmergency?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  startAt: string;
  durationMinutes?: number;
}

export type AppointmentListResponseMeta = ApiMeta;

export const appointmentService = {
  list: async (params: AppointmentListParams = {}): Promise<ApiResponse<AppointmentRecord[]>> =>
    apiClient.get('/appointments', { params }),
  listMy: async (params: AppointmentListParams = {}): Promise<ApiResponse<AppointmentRecord[]>> =>
    apiClient.get('/appointments/my', { params }),
  getById: async (id: string): Promise<ApiResponse<AppointmentRecord>> => apiClient.get(`/appointments/${id}`),
  getSlots: async (doctorId: string, date: string): Promise<ApiResponse<AppointmentSlot[]>> =>
    apiClient.get('/appointments/slots', { params: { doctorId, date } }),
  create: async (payload: CreateAppointmentPayload): Promise<ApiResponse<AppointmentRecord>> =>
    apiClient.post('/appointments', payload),
  createPatient: async (payload: CreateAppointmentPayload): Promise<ApiResponse<AppointmentRecord>> =>
    apiClient.post('/appointments/patient', payload),
  updateStatus: async (id: string, status: AppointmentStatus): Promise<ApiResponse<AppointmentRecord>> =>
    apiClient.patch(`/appointments/${id}/status`, { status }),
};

import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/services/patientService';

export interface StaffRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  list: async (): Promise<ApiResponse<StaffRecord[]>> => apiClient.get('/users'),
  listDoctors: async (): Promise<ApiResponse<StaffRecord[]>> => apiClient.get('/users/doctors'),
  create: async (payload: any): Promise<ApiResponse<StaffRecord>> => apiClient.post('/users', payload),
  update: async (id: string, payload: any): Promise<ApiResponse<StaffRecord>> => apiClient.put(`/users/${id}`, payload),
  toggleActive: async (id: string): Promise<ApiResponse<StaffRecord>> => apiClient.patch(`/users/${id}/toggle`),
};

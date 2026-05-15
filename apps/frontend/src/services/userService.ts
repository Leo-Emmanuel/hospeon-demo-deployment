import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/services/patientService';

export interface DoctorDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: {
    id: string;
    name: string;
  } | null;
}

export const userService = {
  listDoctors: async (): Promise<ApiResponse<DoctorDirectoryItem[]>> => apiClient.get('/users/doctors'),
};

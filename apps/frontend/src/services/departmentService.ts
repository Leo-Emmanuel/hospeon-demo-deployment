import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/services/patientService';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
}

export const departmentService = {
  list: async (): Promise<ApiResponse<Department[]>> => apiClient.get('/departments'),
};

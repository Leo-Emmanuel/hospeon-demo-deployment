import { Patient, Visit, Consultation, Prescription, LabOrder } from '@prisma/client';

export type PatientWithLatestVisit = Patient & {
  visits: (Visit & {
    doctor: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  })[];
  prescriptions: Prescription[];
};

export type PatientFullProfile = Patient & {
  visits: (Visit & {
    doctor: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  })[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  labOrders: (LabOrder & { testCatalog: any; result: any })[];
};

export type PatientListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  visitFrom?: string;
  visitTo?: string;
  followUpDate?: string;
};

export type CreatePatientData = {
  firstName: string;
  lastName: string;
  dob: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  phone?: string;
  email?: string;
  address?: Record<string, unknown>;
  emergencyContact?: Record<string, unknown>;
  insuranceInfo?: Record<string, unknown>;
  departmentId?: string;
};

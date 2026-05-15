export type DashboardDay = 'today' | 'yesterday';

export type AdminSummary = {
  patientsToday: number;
  opdVisitsToday: number;
  pendingLabs: number;
  admissionsToday: number;
};

export type DoctorSummary = AdminSummary & {
  myQueue: number;
  myCompletedToday: number;
  pendingApprovals: number;
};

export type LabTechSummary = {
  pendingByPriority: { priority: string; _count: number }[];
  resultedToday: number;
  approvedToday: number;
};

export type PharmacistSummary = AdminSummary & {
  prescriptionsToday: number;
  activePrescriptionLines: number;
  patientsOnActiveMedication: number;
};

export type DoctorWorkloadItem = {
  doctorId: string;
  doctorName: string;
  consultationCount: number;
};

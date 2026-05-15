import React from 'react';
import { Navigate } from 'react-router-dom';
import { Role } from '@hospeon/shared';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { DoctorDashboard } from '@/features/dashboard/pages/DoctorDashboard';
import { LabDashboard } from '@/features/dashboard/pages/LabDashboard';
import { OperationsDashboard } from '@/features/dashboard/pages/OperationsDashboard';
import { ReceptionDashboard } from '@/features/dashboard/pages/ReceptionDashboard';
import { PharmacyDashboard } from '@/features/dashboard/pages/PharmacyDashboard';
import { AdminDashboard } from '@/features/dashboard/pages/_AdminDashboard';

export function Dashboard() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === Role.DOCTOR) return <DoctorDashboard />;
  if (user.role === Role.LAB_TECHNICIAN) return <LabDashboard />;
  if (user.role === Role.RECEPTIONIST) return <ReceptionDashboard />;
  if (user.role === Role.PHARMACIST) return <PharmacyDashboard />;
  if (user.role === Role.ACCOUNTANT || user.role === Role.STAFF) return <OperationsDashboard />;

  return <AdminDashboard />;
}

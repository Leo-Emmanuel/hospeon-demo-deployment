import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardSummaryParams } from '@/services/dashboardService';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (params: DashboardSummaryParams = {}) => [...dashboardKeys.all, 'summary', params] as const,
  opdQueue: () => [...dashboardKeys.all, 'opd-queue'] as const,
  labQueue: () => [...dashboardKeys.all, 'lab-queue'] as const,
  pharmacyWorklist: () => [...dashboardKeys.all, 'pharmacy-worklist'] as const,
  doctorWorkload: () => [...dashboardKeys.all, 'doctor-workload'] as const,
  recentActivity: () => [...dashboardKeys.all, 'recent-activity'] as const,
};

export const useDashboardSummary = (params: DashboardSummaryParams = {}) =>
  useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => dashboardService.getSummary(params),
    refetchInterval: 60000,
  });

export const useDashboardOpdQueue = () =>
  useQuery({
    queryKey: dashboardKeys.opdQueue(),
    queryFn: () => dashboardService.getOpdQueue(),
    refetchInterval: 30000,
  });

export const useDashboardLabQueue = () =>
  useQuery({
    queryKey: dashboardKeys.labQueue(),
    queryFn: () => dashboardService.getLabQueue(),
    refetchInterval: 30000,
  });

export const usePharmacyWorklist = (enabled = true) =>
  useQuery({
    queryKey: dashboardKeys.pharmacyWorklist(),
    queryFn: () => dashboardService.getPharmacyWorklist(),
    enabled,
    refetchInterval: 60000,
  });

export const useDoctorWorkload = (enabled = true) =>
  useQuery({
    queryKey: dashboardKeys.doctorWorkload(),
    queryFn: () => dashboardService.getDoctorWorkload(),
    enabled,
    refetchInterval: 60000,
  });

export const useRecentActivity = (enabled = true) =>
  useQuery({
    queryKey: dashboardKeys.recentActivity(),
    queryFn: () => dashboardService.getRecentActivity(),
    enabled,
    refetchInterval: 60000,
  });

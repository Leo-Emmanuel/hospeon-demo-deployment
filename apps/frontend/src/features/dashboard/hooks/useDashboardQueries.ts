import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardSummaryParams } from '@/services/dashboardService';

import { QK } from '@/lib/queryKeys';

export const useDashboardSummary = (params: DashboardSummaryParams = {}) =>
  useQuery({
    queryKey: QK.dashboard.summary(params.day),
    queryFn: () => dashboardService.getSummary(params),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

export const useDashboardOpdQueue = () =>
  useQuery({
    queryKey: QK.dashboard.opdQueue(),
    queryFn: () => dashboardService.getOpdQueue(),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

export const useDashboardLabQueue = () =>
  useQuery({
    queryKey: QK.dashboard.labQueue(),
    queryFn: () => dashboardService.getLabQueue(),
    staleTime: 20_000,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
  });

export const usePharmacyWorklist = (enabled = true) =>
  useQuery({
    queryKey: QK.dashboard.pharmacyList(),
    queryFn: () => dashboardService.getPharmacyWorklist(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

export const useDoctorWorkload = (enabled = true) =>
  useQuery({
    queryKey: QK.dashboard.workload(),
    queryFn: () => dashboardService.getDoctorWorkload(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

export const useRecentActivity = (enabled = true) =>
  useQuery({
    queryKey: QK.dashboard.activity(),
    queryFn: () => dashboardService.getRecentActivity(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

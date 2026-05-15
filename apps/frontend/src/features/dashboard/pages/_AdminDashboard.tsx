import React from 'react';
import { Link } from 'react-router-dom';
import { ActivityIcon, BedDoubleIcon, ClipboardListIcon, FlaskConicalIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DonutChart, SimpleBarChart } from '@/components/data-display/MiniChart';
import {
  useDashboardLabQueue,
  useDashboardOpdQueue,
  useDashboardSummary,
  useDoctorWorkload,
  useRecentActivity,
} from '@/features/dashboard/hooks/useDashboardQueries';
import { useAuthStore } from '@/features/auth/store/auth.store';

const waitMinutes = (dateString: string) => Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const formatTimeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const buildDelta = (current: number, previous: number, betterWhenLower = false) => {
  const diff = current - previous;

  if (diff === 0) {
    return { value: '0', trend: 'flat' as const, tone: 'neutral' as const };
  }

  const improved = betterWhenLower ? diff < 0 : diff > 0;
  return {
    value: `${diff > 0 ? '+' : ''}${diff}`,
    trend: diff > 0 ? ('up' as const) : ('down' as const),
    tone: improved ? ('positive' as const) : ('negative' as const),
  };
};

export function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const summaryQuery = useDashboardSummary();
  const yesterdaySummaryQuery = useDashboardSummary({ day: 'yesterday' });
  const opdQueueQuery = useDashboardOpdQueue();
  const labQueueQuery = useDashboardLabQueue();
  const workloadQuery = useDoctorWorkload();
  const recentActivityQuery = useRecentActivity();

  const summary = summaryQuery.data?.data as
    | { patientsToday?: number; opdVisitsToday?: number; pendingLabs?: number; admissionsToday?: number }
    | undefined;
  const yesterdaySummary = yesterdaySummaryQuery.data?.data as
    | { patientsToday?: number; opdVisitsToday?: number; pendingLabs?: number; admissionsToday?: number }
    | undefined;
  const opdQueue = opdQueueQuery.data?.data || [];
  const labQueue = labQueueQuery.data?.data || [];
  const workload = workloadQuery.data?.data || [];
  const recentActivity = recentActivityQuery.data?.data || [];

  const workloadChartData = workload.map((item) => ({
    label: item.doctorName.split(' ')[0] || item.doctorName,
    value: item.consultationCount,
  }));

  const labStatusMap = [
    { label: 'Pending', value: labQueue.filter((order) => order.status === 'PENDING').length, color: '#F59E0B' },
    { label: 'Collected', value: labQueue.filter((order) => order.status === 'SAMPLE_COLLECTED').length, color: '#3B82F6' },
    { label: 'Processing', value: labQueue.filter((order) => order.status === 'PROCESSING').length, color: '#8B5CF6' },
    { label: 'Resulted', value: labQueue.filter((order) => order.status === 'RESULTED').length, color: '#14B8A6' },
  ].filter((item) => item.value > 0);

  const urgentLabCount = labQueue.filter((order) => order.priority === 'URGENT').length;

  const statLabAlerts = labQueue
    .filter((order) => order.priority === 'STAT' && waitMinutes(order.orderedAt) > 60)
    .map((order) => ({
      id: `stat-${order.id}`,
      tone: 'danger' as const,
      title: `STAT lab overdue: ${order.testCatalog?.name || 'Unnamed test'} for ${order.patient.firstName} ${order.patient.lastName}`,
      subtitle: `Ordered ${formatDateTime(order.orderedAt)} - ${waitMinutes(order.orderedAt)} min open`,
    }));

  const longWaitAlerts = opdQueue
    .filter((visit) => visit.status === 'WAITING' && waitMinutes(visit.checkedInAt) > 30)
    .map((visit) => ({
      id: `wait-${visit.id}`,
      tone: 'warning' as const,
      title: `Patient waiting >30 min: ${visit.patient.firstName} ${visit.patient.lastName}, Dr. ${visit.doctor?.name || 'Unassigned'}`,
      subtitle: `Checked in ${formatDateTime(visit.checkedInAt)} - waiting ${waitMinutes(visit.checkedInAt)} min`,
    }));

  const alerts = [...statLabAlerts, ...longWaitAlerts];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day, ${user?.name?.split(' ')[0] || 'Admin'}`}
        description="Live operational dashboard across patients, visits, diagnostics, and audit activity."
        actions={
          <>
            <Link to="/visits/today">
              <Button variant="secondary">Open OPD queue</Button>
            </Link>
            <Link to="/lab/queue">
              <Button variant="primary">Open lab queue</Button>
            </Link>
          </>
        }
      />

      {summaryQuery.isLoading || yesterdaySummaryQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <LoadingSkeleton rows={3} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Patients today"
            value={<MonoNumber>{summary?.patientsToday || 0}</MonoNumber>}
            icon={<UsersIcon className="w-4 h-4" />}
            delta={buildDelta(summary?.patientsToday || 0, yesterdaySummary?.patientsToday || 0)}
          />
          <MetricCard
            label="OPD visits today"
            value={<MonoNumber>{summary?.opdVisitsToday || 0}</MonoNumber>}
            icon={<ClipboardListIcon className="w-4 h-4" />}
            delta={buildDelta(summary?.opdVisitsToday || 0, yesterdaySummary?.opdVisitsToday || 0)}
          />
          <MetricCard
            label="Pending labs"
            value={<MonoNumber>{summary?.pendingLabs || 0}</MonoNumber>}
            icon={<FlaskConicalIcon className="w-4 h-4" />}
            tone="warning"
            delta={buildDelta(summary?.pendingLabs || 0, yesterdaySummary?.pendingLabs || 0, true)}
          />
          <MetricCard
            label="Admissions today"
            value={<MonoNumber>{summary?.admissionsToday || 0}</MonoNumber>}
            icon={<BedDoubleIcon className="w-4 h-4" />}
            delta={buildDelta(summary?.admissionsToday || 0, yesterdaySummary?.admissionsToday || 0)}
          />
        </div>
      )}

      <Card>
        <SectionTitle title="Doctor workload" description="Consultations completed today by doctor." />
        {workloadQuery.isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : workloadChartData.length === 0 ? (
          <EmptyState compact title="No workload data" description="No consultation activity was returned for today." />
        ) : (
          <div className="space-y-5">
            <SimpleBarChart data={workloadChartData} color="#2F7A6E" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {workload.map((item) => (
                <div key={item.doctorId} className="rounded-xl bg-subtle/70 dark:bg-subtle-dark/70 p-3">
                  <p className="font-medium">{item.doctorName}</p>
                  <p className="text-xs text-ink-tertiary mt-1">{item.consultationCount} consultations today</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Lab queue mix"
          description="Grouped from the live lab queue endpoint."
          action={
            <StatusBadge tone={urgentLabCount > 0 ? 'warning' : 'neutral'}>
              Urgent items <MonoNumber size="xs">{urgentLabCount}</MonoNumber>
            </StatusBadge>
          }
        />
        {labQueueQuery.isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : labStatusMap.length === 0 ? (
          <EmptyState compact title="No lab orders" description="The live lab queue is currently empty." />
        ) : (
          <DonutChart
            data={labStatusMap}
            centerLabel="Active orders"
            centerValue={String(labQueue.length)}
            size={156}
          />
        )}
      </Card>

      <Card>
        <SectionTitle title="System alerts" description="Real-time alerts computed from STAT lab orders and waiting-room delays." />
        {opdQueueQuery.isLoading || labQueueQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : alerts.length === 0 ? (
          <EmptyState compact title="No active alerts" description="No overdue STAT labs or long waiting patients are active right now." />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={
                  alert.tone === 'danger'
                    ? 'rounded-xl border border-danger/25 bg-danger-soft/40 p-4'
                    : 'rounded-xl border border-warning/25 bg-warning-soft/40 p-4'
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-ink-secondary mt-1">{alert.subtitle}</p>
                  </div>
                  <StatusBadge tone={alert.tone}>{alert.tone === 'danger' ? 'STAT overdue' : 'Long wait'}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle title="Recent activity" description="Last 10 audit events across the system." />
        {recentActivityQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : recentActivity.length === 0 ? (
          <EmptyState compact title="No recent activity" description="No audit events were returned." />
        ) : (
          <div className="space-y-4">
            {recentActivity.slice(0, 10).map((item, index) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-subtle dark:bg-subtle-dark text-ink-secondary">
                    <ActivityIcon className="w-4 h-4" />
                  </span>
                  {index < Math.min(recentActivity.length, 10) - 1 ? <span className="mt-2 h-full w-px bg-line dark:bg-line-dark" /> : null}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">
                    {item.actor?.name || 'System'} - {item.action} - {item.entityType}
                  </p>
                  <p className="text-xs text-ink-tertiary mt-1">
                    {formatTimeAgo(item.createdAt)} - {formatDateTime(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

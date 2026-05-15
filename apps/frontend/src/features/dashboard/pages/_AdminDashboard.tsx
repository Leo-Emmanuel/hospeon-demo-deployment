import React from 'react';
import { Link } from 'react-router-dom';
import { ActivityIcon, ClipboardListIcon, FlaskConicalIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge } from '@/components/ui/StatusBadge';
import {
  useDashboardLabQueue,
  useDashboardOpdQueue,
  useDashboardSummary,
  useDoctorWorkload,
  useRecentActivity,
} from '@/features/dashboard/hooks/useDashboardQueries';
import { useAuthStore } from '@/features/auth/store/auth.store';

export function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const summaryQuery = useDashboardSummary();
  const opdQueueQuery = useDashboardOpdQueue();
  const labQueueQuery = useDashboardLabQueue();
  const workloadQuery = useDoctorWorkload();
  const recentActivityQuery = useRecentActivity();

  const summary = summaryQuery.data?.data as { patientsToday?: number; opdVisitsToday?: number; pendingLabs?: number } | undefined;
  const opdQueue = opdQueueQuery.data?.data || [];
  const labQueue = labQueueQuery.data?.data || [];
  const workload = workloadQuery.data?.data || [];
  const recentActivity = recentActivityQuery.data?.data || [];

  if (summaryQuery.isLoading && opdQueueQuery.isLoading && labQueueQuery.isLoading) {
    return <LoadingSkeleton rows={10} />;
  }

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Patients today" value={<MonoNumber>{summary?.patientsToday || 0}</MonoNumber>} icon={<UsersIcon className="w-4 h-4" />} />
        <MetricCard label="OPD visits" value={<MonoNumber>{summary?.opdVisitsToday || 0}</MonoNumber>} icon={<ClipboardListIcon className="w-4 h-4" />} />
        <MetricCard label="Pending labs" value={<MonoNumber>{summary?.pendingLabs || 0}</MonoNumber>} icon={<FlaskConicalIcon className="w-4 h-4" />} />
        <MetricCard label="Recent audit items" value={<MonoNumber>{recentActivity.length}</MonoNumber>} icon={<ActivityIcon className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Live OPD queue" description="Current queue from the dashboard API." />
          {opdQueueQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : opdQueue.length === 0 ? (
            <EmptyState compact title="No OPD visits" description="No OPD queue entries are active right now." />
          ) : (
            <DataTable
              data={opdQueue.slice(0, 8)}
              rowKey={(visit) => visit.id}
              dense
              columns={[
                { key: 'tokenNumber', header: 'Token', render: (visit) => <MonoNumber>{visit.tokenNumber}</MonoNumber> },
                {
                  key: 'patient',
                  header: 'Patient',
                  render: (visit) => `${visit.patient.firstName} ${visit.patient.lastName}`,
                },
                { key: 'doctor', header: 'Doctor', render: (visit) => visit.doctor?.name || '—' },
                { key: 'status', header: 'Status', render: (visit) => <AutoStatusBadge status={visit.status.toLowerCase()} /> },
              ]}
            />
          )}
        </Card>

        <Card>
          <SectionTitle title="Live lab queue" description="Pending and in-progress diagnostic orders." />
          {labQueueQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : labQueue.length === 0 ? (
            <EmptyState compact title="No lab orders" description="The live lab queue is currently empty." />
          ) : (
            <DataTable
              data={labQueue.slice(0, 8)}
              rowKey={(order) => order.id}
              dense
              columns={[
                { key: 'id', header: 'Order', render: (order) => <MonoNumber>{order.id}</MonoNumber> },
                {
                  key: 'patient',
                  header: 'Patient',
                  render: (order) => `${order.patient.firstName} ${order.patient.lastName}`,
                },
                { key: 'testCatalog', header: 'Test', render: (order) => order.testCatalog?.name || '—' },
                { key: 'status', header: 'Status', render: (order) => <AutoStatusBadge status={order.status.toLowerCase()} /> },
              ]}
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Doctor workload" description="Consultation volume returned by the admin dashboard endpoint." />
          {workloadQuery.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : workload.length === 0 ? (
            <EmptyState compact title="No workload data" description="No consultation activity was returned for today." />
          ) : (
            <div className="space-y-3">
              {workload.map((item) => (
                <div key={item.doctorId} className="flex items-center justify-between rounded-xl bg-subtle/60 dark:bg-subtle-dark/60 p-3">
                  <MonoNumber>{item.doctorId}</MonoNumber>
                  <span className="text-sm font-medium">{item._count} consults</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Recent activity" description="Audit feed from the backend." />
          {recentActivityQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : recentActivity.length === 0 ? (
            <EmptyState compact title="No recent activity" description="No audit events were returned." />
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-xl border border-line dark:border-line-dark p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.action} · {item.entityType}</p>
                      <p className="text-xs text-ink-tertiary mt-1">
                        {item.actor?.name || 'System'} · {new Date(item.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <MonoNumber size="xs">{item.entityId || '—'}</MonoNumber>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

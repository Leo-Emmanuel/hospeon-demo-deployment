import React from 'react';
import { Link } from 'react-router-dom';
import { FileTextIcon, PlayIcon, StethoscopeIcon, TestTubeIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useDashboardOpdQueue, useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';
import { useLabOrders } from '@/features/laboratory/hooks/useLabQueries';

export function DoctorDashboard() {
  const user = useAuthStore((state) => state.user);
  const summaryQuery = useDashboardSummary();
  const queueQuery = useDashboardOpdQueue();
  const approvalsQuery = useLabOrders({ page: 1, limit: 20, status: 'RESULTED' });

  const summary = summaryQuery.data?.data as {
    patientsToday?: number;
    opdVisitsToday?: number;
    pendingLabs?: number;
    myQueue?: number;
    myCompletedToday?: number;
    pendingApprovals?: number;
  } | undefined;

  const myQueue = (queueQuery.data?.data || []).filter((visit) => visit.doctor?.id === user?.id);
  const myPendingApprovals = (approvalsQuery.data?.data || []).filter((order) => order.orderedByUser?.id === user?.id);

  if (summaryQuery.isLoading && queueQuery.isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Doctor desk · ${user?.name || 'Doctor'}`}
        description="Your queue, completed consultations, and pending lab approvals for today."
        actions={
          <>
            <Link to="/visits/today">
              <Button variant="secondary">Open full queue</Button>
            </Link>
            <Link to="/lab/reports">
              <Button variant="primary">Review lab reports</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="My queue" value={<MonoNumber>{summary?.myQueue || myQueue.length}</MonoNumber>} icon={<StethoscopeIcon className="w-4 h-4" />} />
        <MetricCard label="Completed today" value={<MonoNumber>{summary?.myCompletedToday || 0}</MonoNumber>} icon={<PlayIcon className="w-4 h-4" />} />
        <MetricCard label="Pending lab approvals" value={<MonoNumber>{summary?.pendingApprovals || myPendingApprovals.length}</MonoNumber>} icon={<FileTextIcon className="w-4 h-4" />} />
        <MetricCard label="Pending labs overall" value={<MonoNumber>{summary?.pendingLabs || 0}</MonoNumber>} icon={<TestTubeIcon className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Up next" description="Patients currently assigned to your OPD queue." />
          {queueQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : myQueue.length === 0 ? (
            <EmptyState compact title="No patients in your queue" description="You have no assigned OPD visits right now." />
          ) : (
            <div className="space-y-3">
              {myQueue.slice(0, 8).map((visit) => (
                <div key={visit.id} className="rounded-xl border border-line dark:border-line-dark p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {visit.patient.firstName} {visit.patient.lastName}
                    </div>
                    <p className="text-xs text-ink-tertiary mt-1">
                      <MonoNumber>{visit.patient.uhid}</MonoNumber> · Token <MonoNumber>{visit.tokenNumber}</MonoNumber>
                    </p>
                    <p className="text-sm text-ink-secondary mt-2">{visit.chiefComplaint || 'No chief complaint recorded'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AutoStatusBadge status={visit.status.toLowerCase()} />
                    <Link to={`/visits/${visit.id}/consult`}>
                      <Button size="sm" variant="primary">
                        Start
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Pending lab report approvals" description="Resulted lab orders you requested that still need doctor approval." />
          {approvalsQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : myPendingApprovals.length === 0 ? (
            <EmptyState compact title="No pending approvals" description="There are no resulted reports waiting for your action." />
          ) : (
            <div className="space-y-3">
              {myPendingApprovals.slice(0, 8).map((order) => (
                <Link key={order.id} to={`/lab/reports?orderId=${order.id}`} className="block rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <MonoNumber size="xs" className="text-ink-tertiary">{order.id}</MonoNumber>
                      <p className="font-medium mt-1">
                        {order.patient.firstName} {order.patient.lastName}
                      </p>
                      <p className="text-sm text-ink-secondary mt-1">{order.testCatalog.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <AutoStatusBadge status={order.status.toLowerCase()} />
                      {order.result?.isAbnormal ? <StatusBadge tone="warning">Abnormal</StatusBadge> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2Icon, ClockIcon, FileTextIcon, TestTubeIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';
import { useLabOrders } from '@/features/laboratory/hooks/useLabQueries';

export function LabDashboard() {
  const summaryQuery = useDashboardSummary();
  const queueQuery = useLabOrders({ page: 1, limit: 20 });
  const summary = summaryQuery.data?.data as {
    pendingByPriority?: Array<{ priority: 'ROUTINE' | 'URGENT' | 'STAT'; _count: number }>;
    resultedToday?: number;
    approvedToday?: number;
  } | undefined;
  const orders = queueQuery.data?.data || [];
  const pending = orders.filter((order) => order.status === 'PENDING');
  const processing = orders.filter((order) => ['SAMPLE_COLLECTED', 'PROCESSING'].includes(order.status));

  if (summaryQuery.isLoading && queueQuery.isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory dashboard"
        description="Live specimen, processing, and approval workload from the current lab queue."
        actions={
          <>
            <Link to="/lab/collection">
              <Button variant="secondary">Collection</Button>
            </Link>
            <Link to="/lab/queue">
              <Button variant="primary">Open queue</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Pending collection" value={<MonoNumber>{pending.length}</MonoNumber>} icon={<TestTubeIcon className="w-4 h-4" />} />
        <MetricCard label="In process" value={<MonoNumber>{processing.length}</MonoNumber>} icon={<ClockIcon className="w-4 h-4" />} />
        <MetricCard label="Resulted today" value={<MonoNumber>{summary?.resultedToday || 0}</MonoNumber>} icon={<FileTextIcon className="w-4 h-4" />} />
        <MetricCard label="Approved today" value={<MonoNumber>{summary?.approvedToday || 0}</MonoNumber>} icon={<CheckCircle2Icon className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Priority mix" description="Live priority counts returned by the lab summary endpoint." />
          <div className="space-y-3">
            {(summary?.pendingByPriority || []).map((item) => (
              <div key={item.priority} className="flex items-center justify-between rounded-xl bg-subtle/60 dark:bg-subtle-dark/60 p-3">
                <StatusBadge tone={item.priority === 'STAT' ? 'danger' : item.priority === 'URGENT' ? 'warning' : 'neutral'}>
                  {item.priority}
                </StatusBadge>
                <MonoNumber>{item._count}</MonoNumber>
              </div>
            ))}
            {(!summary?.pendingByPriority || summary.pendingByPriority.length === 0) && (
              <EmptyState compact title="No pending priorities" description="No queued lab priorities were returned." />
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Next actions" description="Orders that need collection or result entry right now." />
          {queueQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : orders.length === 0 ? (
            <EmptyState compact title="No active lab orders" description="The live lab queue is empty right now." />
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 8).map((order) => (
                <div key={order.id} className="rounded-xl border border-line dark:border-line-dark p-4 flex items-center justify-between gap-4">
                  <div>
                    <MonoNumber size="xs" className="text-ink-tertiary">{order.id}</MonoNumber>
                    <p className="font-medium mt-1">
                      {order.patient.firstName} {order.patient.lastName}
                    </p>
                    <p className="text-sm text-ink-secondary mt-1">{order.testCatalog.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AutoStatusBadge status={order.status.toLowerCase()} />
                    <Link to={order.status === 'PENDING' ? `/lab/collection?orderId=${order.id}` : `/lab/orders/${order.id}/results`}>
                      <Button size="sm" variant="secondary">
                        {order.status === 'PENDING' ? 'Collect' : 'Process'}
                      </Button>
                    </Link>
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

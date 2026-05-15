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
import { useDashboardLabQueue, useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const formatOverdueHours = (orderedAt: string, turnaroundHours: number) => {
  const targetTime = new Date(orderedAt).getTime() + turnaroundHours * 3600000;
  const diffHours = Math.max(0, (Date.now() - targetTime) / 3600000);
  return `${diffHours.toFixed(1)}h`;
};

export function LabDashboard() {
  const summaryQuery = useDashboardSummary();
  const queueQuery = useDashboardLabQueue();
  const summary = summaryQuery.data?.data as
    | {
        pendingByPriority?: Array<{ priority: 'ROUTINE' | 'URGENT' | 'STAT'; _count: number }>;
        resultedToday?: number;
        approvedToday?: number;
      }
    | undefined;
  const orders = queueQuery.data?.data || [];

  const priorityCounts = {
    STAT: orders.filter((order) => order.priority === 'STAT').length,
    URGENT: orders.filter((order) => order.priority === 'URGENT').length,
    ROUTINE: orders.filter((order) => order.priority === 'ROUTINE').length,
  };

  const overdueOrders = orders.filter((order) => {
    const turnaroundHours = order.testCatalog?.turnaroundHours;
    if (!turnaroundHours) return false;
    return new Date(order.orderedAt).getTime() + turnaroundHours * 3600000 < Date.now();
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory dashboard"
        description="Live specimen, processing, turnaround, and approval workload from the active lab queue."
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

      {summaryQuery.isLoading || queueQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <LoadingSkeleton rows={3} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Link to="/lab/queue?priority=STAT" className="block">
            <MetricCard
              label="STAT"
              value={<MonoNumber>{priorityCounts.STAT}</MonoNumber>}
              icon={<TestTubeIcon className="w-4 h-4" />}
              tone="danger"
              hint="Open STAT queue"
            />
          </Link>
          <Link to="/lab/queue?priority=URGENT" className="block">
            <MetricCard
              label="Urgent"
              value={<MonoNumber>{priorityCounts.URGENT}</MonoNumber>}
              icon={<ClockIcon className="w-4 h-4" />}
              tone="warning"
              hint="Open urgent queue"
            />
          </Link>
          <Link to="/lab/queue?priority=ROUTINE" className="block">
            <MetricCard
              label="Routine"
              value={<MonoNumber>{priorityCounts.ROUTINE}</MonoNumber>}
              icon={<TestTubeIcon className="w-4 h-4" />}
              hint="Open routine queue"
            />
          </Link>
          <MetricCard
            label="Resulted today"
            value={<MonoNumber>{summary?.resultedToday || 0}</MonoNumber>}
            icon={<FileTextIcon className="w-4 h-4" />}
          />
          <MetricCard
            label="Approved today"
            value={<MonoNumber>{summary?.approvedToday || 0}</MonoNumber>}
            icon={<CheckCircle2Icon className="w-4 h-4" />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Overdue turnaround" description="Orders whose turnaround target has already been exceeded." />
          {queueQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : overdueOrders.length === 0 ? (
            <EmptyState compact title="No overdue TAT items" description="No active lab orders are beyond their turnaround target." />
          ) : (
            <div className="space-y-3">
              {overdueOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-danger/25 bg-danger-soft/35 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{order.testCatalog?.name || 'Unnamed test'}</p>
                      <p className="text-sm text-ink-secondary mt-1">
                        {order.patient.firstName} {order.patient.lastName}
                      </p>
                      <p className="text-xs text-ink-tertiary mt-2">Ordered {formatDateTime(order.orderedAt)}</p>
                    </div>
                    <StatusBadge tone="danger">
                      Overdue by {formatOverdueHours(order.orderedAt, order.testCatalog?.turnaroundHours || 0)}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Active queue snapshot" description="Current orders that need collection, processing, or review." />
          {queueQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : orders.length === 0 ? (
            <EmptyState compact title="No active lab orders" description="The live lab queue is empty right now." />
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 8).map((order) => (
                <div key={order.id} className="rounded-xl border border-line dark:border-line-dark p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{order.testCatalog?.name || 'Unnamed test'}</p>
                    <p className="text-sm text-ink-secondary mt-1">
                      {order.patient.firstName} {order.patient.lastName}
                    </p>
                    <p className="text-xs text-ink-tertiary mt-2">{formatDateTime(order.orderedAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AutoStatusBadge status={order.status.toLowerCase()} />
                    <StatusBadge tone={order.priority === 'STAT' ? 'danger' : order.priority === 'URGENT' ? 'warning' : 'neutral'}>
                      {order.priority}
                    </StatusBadge>
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

import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlusIcon, IndianRupeeIcon, UserPlusIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { useDashboardOpdQueue, useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';

const waitMinutes = (dateString: string) => Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));

export function ReceptionDashboard() {
  const summaryQuery = useDashboardSummary();
  const queueQuery = useDashboardOpdQueue();
  const summary = summaryQuery.data?.data as { patientsToday?: number; opdVisitsToday?: number; pendingLabs?: number } | undefined;
  const queue = queueQuery.data?.data || [];
  const longWaiters = queue.filter((visit) => waitMinutes(visit.checkedInAt) > 30 && visit.status === 'WAITING');

  if (summaryQuery.isLoading && queueQuery.isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reception desk"
        description="Live intake, queue, and waiting-room overview for the front desk."
        actions={
          <>
            <Link to="/patients/register">
              <Button variant="secondary">
                <UserPlusIcon className="w-4 h-4" />
                Register patient
              </Button>
            </Link>
            <Link to="/appointments/new">
              <Button variant="primary">
                <CalendarPlusIcon className="w-4 h-4" />
                New appointment
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Patients today" value={<MonoNumber>{summary?.patientsToday || 0}</MonoNumber>} />
        <MetricCard label="OPD visits" value={<MonoNumber>{summary?.opdVisitsToday || queue.length}</MonoNumber>} />
        <MetricCard label="Waiting now" value={<MonoNumber>{queue.filter((visit) => visit.status === 'WAITING').length}</MonoNumber>} />
        <MetricCard label="Long waits >30m" value={<MonoNumber>{longWaiters.length}</MonoNumber>} icon={<IndianRupeeIcon className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Live queue" description="Token order across all active OPD visits." />
          {queueQuery.isLoading ? (
            <LoadingSkeleton rows={6} />
          ) : queue.length === 0 ? (
            <EmptyState compact title="No active queue" description="No OPD visits are active right now." />
          ) : (
            <div className="space-y-3">
              {queue.slice(0, 10).map((visit) => (
                <div key={visit.id} className="rounded-xl border border-line dark:border-line-dark p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {visit.patient.firstName} {visit.patient.lastName}
                    </p>
                    <p className="text-xs text-ink-tertiary mt-1">
                      Token <MonoNumber>{visit.tokenNumber}</MonoNumber> · {visit.doctor?.name || 'Doctor not assigned'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AutoStatusBadge status={visit.status.toLowerCase()} />
                    <MonoNumber size="xs">{waitMinutes(visit.checkedInAt)}m</MonoNumber>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Front desk alerts" description="Patients waiting beyond threshold and lab backlog visible to reception." />
          {longWaiters.length === 0 ? (
            <EmptyState compact title="No long waits right now" description="No receptionist alerts are active at the moment." />
          ) : (
            <div className="space-y-3">
              {longWaiters.map((visit) => (
                <div key={visit.id} className="rounded-xl border border-warning/30 bg-warning-soft/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {visit.patient.firstName} {visit.patient.lastName}
                      </p>
                      <p className="text-sm text-ink-secondary mt-1">{visit.doctor?.name || 'Doctor not assigned'}</p>
                    </div>
                    <StatusBadge tone="warning">Waiting {waitMinutes(visit.checkedInAt)}m</StatusBadge>
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

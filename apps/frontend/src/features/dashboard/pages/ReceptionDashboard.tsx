import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlusIcon, UserPlusIcon, UsersIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Sparkline } from '@/components/data-display/MiniChart';
import { useDashboardOpdQueue, useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';
import { usePatients } from '@/features/patients/hooks/usePatientQueries';
import { userService } from '@/services/userService';

const waitMinutes = (dateString: string) => Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export function ReceptionDashboard() {
  const summaryQuery = useDashboardSummary();
  const queueQuery = useDashboardOpdQueue();
  const doctorsQuery = useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: () => userService.listDoctors(),
    refetchInterval: 60000,
  });
  const recentRegistrationsQuery = usePatients({ limit: 5, sort: 'createdAt', order: 'desc' });

  const summary = summaryQuery.data?.data as { patientsToday?: number; opdVisitsToday?: number; pendingLabs?: number } | undefined;
  const queue = queueQuery.data?.data || [];
  const doctors = doctorsQuery.data?.data || [];
  const recentRegistrations = recentRegistrationsQuery.data?.data || [];
  const longWaiters = queue.filter((visit) => waitMinutes(visit.checkedInAt) > 30 && visit.status === 'WAITING');

  const hourlyVisits = Array.from({ length: 24 }, (_, hour) =>
    queue.filter((visit) => new Date(visit.checkedInAt).getHours() === hour).length
  );
  const peakHourValue = Math.max(...hourlyVisits, 0);
  const peakHourIndex = hourlyVisits.findIndex((count) => count === peakHourValue);

  const doctorsOnDuty = doctors
    .map((doctor) => ({
      ...doctor,
      waitingCount: queue.filter((visit) => visit.doctor?.id === doctor.id && visit.status === 'WAITING').length,
    }))
    .sort((left, right) => right.waitingCount - left.waitingCount || left.name.localeCompare(right.name));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reception desk"
        description="Live intake, queue, and on-duty doctor overview for the front desk."
        actions={
          <>
            <Link to="/patients/new">
              <Button variant="primary">
                <UserPlusIcon className="w-4 h-4" />
                Quick register
              </Button>
            </Link>
            <Link to="/appointments/new">
              <Button variant="secondary">
                <CalendarPlusIcon className="w-4 h-4" />
                New appointment
              </Button>
            </Link>
          </>
        }
      />

      {summaryQuery.isLoading || queueQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <LoadingSkeleton rows={3} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Patients today" value={<MonoNumber>{summary?.patientsToday || 0}</MonoNumber>} icon={<UsersIcon className="w-4 h-4" />} />
          <MetricCard label="OPD visits" value={<MonoNumber>{summary?.opdVisitsToday || queue.length}</MonoNumber>} />
          <MetricCard label="Waiting now" value={<MonoNumber>{queue.filter((visit) => visit.status === 'WAITING').length}</MonoNumber>} />
          <MetricCard label="Long waits >30m" value={<MonoNumber>{longWaiters.length}</MonoNumber>} hint="Front desk watchlist" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Hourly check-ins" description="Visits grouped by checked-in hour from today's OPD queue." />
          {queueQuery.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : queue.length === 0 ? (
            <EmptyState compact title="No check-ins yet" description="The sparkline will appear once today's OPD visits begin arriving." />
          ) : (
            <div className="space-y-4">
              <Sparkline data={hourlyVisits} height={72} color="#2F7A6E" />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-secondary">Peak hour</span>
                <span className="font-medium">
                  {peakHourIndex.toString().padStart(2, '0')}:00 - {peakHourValue} check-ins
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Doctors on duty today" description="Doctor directory joined with how many waiting patients each doctor currently has." />
          {doctorsQuery.isLoading || queueQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : doctorsOnDuty.length === 0 ? (
            <EmptyState compact title="No doctors available" description="No doctor profiles were returned for today's reception dashboard." />
          ) : (
            <div className="space-y-3">
              {doctorsOnDuty.map((doctor) => (
                <div key={doctor.id} className="rounded-xl border border-line dark:border-line-dark p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{doctor.name}</p>
                    <p className="text-sm text-ink-secondary mt-1">{doctor.department?.name || 'Department not assigned'}</p>
                  </div>
                  <StatusBadge tone={doctor.waitingCount > 0 ? 'warning' : 'neutral'}>
                    {doctor.waitingCount} waiting
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Recent registrations" description="Last five patients created in the patient registry." />
        {recentRegistrationsQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : recentRegistrations.length === 0 ? (
          <EmptyState compact title="No recent registrations" description="New patient registrations will appear here once front-desk intake starts." />
        ) : (
          <div className="space-y-3">
            {recentRegistrations.map((patient) => (
              <Link
                key={patient.id}
                to={`/patients/${patient.id}`}
                className="block rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-ink-tertiary mt-1">
                      <MonoNumber>{patient.uhid}</MonoNumber>
                    </p>
                  </div>
                  <span className="text-xs text-ink-tertiary">{formatDateTime(patient.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

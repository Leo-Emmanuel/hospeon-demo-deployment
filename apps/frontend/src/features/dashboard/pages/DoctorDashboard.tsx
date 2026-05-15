import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClockIcon, FileTextIcon, PlayIcon, StethoscopeIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useDashboardOpdQueue, useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';
import { usePatients } from '@/features/patients/hooks/usePatientQueries';

const todayIso = new Date().toISOString().slice(0, 10);

export function DoctorDashboard() {
  const user = useAuthStore((state) => state.user);
  const summaryQuery = useDashboardSummary();
  const queueQuery = useDashboardOpdQueue();
  const followUpsQuery = usePatients({ limit: 10, followUpDate: todayIso, sort: 'firstName', order: 'asc' });

  const summary = summaryQuery.data?.data as
    | {
        patientsToday?: number;
        opdVisitsToday?: number;
        pendingLabs?: number;
        admissionsToday?: number;
        myQueue?: number;
        myCompletedToday?: number;
        pendingApprovals?: number;
      }
    | undefined;

  const myVisitsToday = (queueQuery.data?.data || []).filter((visit) => visit.doctor?.id === user?.id);
  const waitingPatients = myVisitsToday.filter((visit) => visit.status === 'WAITING');
  const activeQueueCount = myVisitsToday.filter((visit) => ['WAITING', 'IN_CONSULTATION'].includes(visit.status)).length;
  const completedToday = summary?.myCompletedToday || 0;
  const totalConsultationsToday = completedToday + (summary?.myQueue ?? activeQueueCount);
  const completionPct = totalConsultationsToday > 0 ? Math.round((completedToday / totalConsultationsToday) * 100) : 0;
  const followUpPatients = followUpsQuery.data?.data || [];
  const followUpCount = followUpsQuery.data?.meta?.total || followUpPatients.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Doctor desk - ${user?.name || 'Doctor'}`}
        description="Your queue, consultation progress, lab approvals, and follow-ups due today."
        actions={
          <>
            <Link to="/visits/today">
              <Button variant="secondary">Open full queue</Button>
            </Link>
            <Link to="/lab/reports?approveOnly=true">
              <Button variant="primary">Review approvals</Button>
            </Link>
          </>
        }
      />

      {summaryQuery.isLoading ? (
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
            label="My queue"
            value={<MonoNumber>{summary?.myQueue || activeQueueCount}</MonoNumber>}
            icon={<StethoscopeIcon className="w-4 h-4" />}
            hint={`${waitingPatients.length} waiting right now`}
          />
          <MetricCard
            label="Consultations today"
            value={<MonoNumber>{completedToday}</MonoNumber>}
            icon={<PlayIcon className="w-4 h-4" />}
            sublabel={`/ ${totalConsultationsToday || 0}`}
            hint={`${completionPct}% completed`}
          />
          <Link to="/lab/reports?approveOnly=true" className="block">
            <MetricCard
              label="Pending lab approvals"
              value={<MonoNumber>{summary?.pendingApprovals || 0}</MonoNumber>}
              icon={<FileTextIcon className="w-4 h-4" />}
              tone={summary?.pendingApprovals ? 'warning' : 'default'}
              hint="Open filtered reports"
            />
          </Link>
          <MetricCard
            label="Follow-up due today"
            value={<MonoNumber>{followUpCount}</MonoNumber>}
            icon={<CalendarClockIcon className="w-4 h-4" />}
            hint="Patients needing review today"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="My waiting patients" description="Live OPD queue filtered to patients still waiting for you." />
          {queueQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : waitingPatients.length === 0 ? (
            <EmptyState compact title="No patients in your waiting queue" description="You have no waiting OPD visits right now." />
          ) : (
            <div className="space-y-3">
              {waitingPatients.slice(0, 8).map((visit) => (
                <div key={visit.id} className="rounded-xl border border-line dark:border-line-dark p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {visit.patient.firstName} {visit.patient.lastName}
                    </div>
                    <p className="text-xs text-ink-tertiary mt-1">
                      <MonoNumber>{visit.patient.uhid}</MonoNumber> - Token <MonoNumber>{visit.tokenNumber}</MonoNumber>
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
          <SectionTitle title="Consultation progress" description="Completed versus active consultations for your desk today." />
          {summaryQuery.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : totalConsultationsToday === 0 ? (
            <EmptyState compact title="No consultations yet" description="Your consultation progress will appear once patients are assigned today." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-subtle/70 dark:bg-subtle-dark/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{completedToday} completed</p>
                    <p className="text-sm text-ink-secondary mt-1">{summary?.myQueue || activeQueueCount} still active in queue</p>
                  </div>
                  <StatusBadge tone="info">{completionPct}% done</StatusBadge>
                </div>
                <div className="mt-4 h-2 rounded-full bg-line dark:bg-line-dark overflow-hidden">
                  <div className="h-full rounded-full bg-[#2F7A6E]" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
              <p className="text-sm text-ink-secondary">
                Total tracked today: <span className="font-medium text-ink-primary dark:text-ink-primary-dark">{totalConsultationsToday}</span>
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Follow-up due today" description="Patients returned by the patient list endpoint using today's follow-up filter." />
        {followUpsQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : followUpPatients.length === 0 ? (
          <EmptyState compact title="No follow-ups due today" description="There are no patients scheduled for a doctor follow-up today." />
        ) : (
          <div className="space-y-3">
            {followUpPatients.slice(0, 8).map((patient) => (
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
                  <StatusBadge tone="warning">Due today</StatusBadge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

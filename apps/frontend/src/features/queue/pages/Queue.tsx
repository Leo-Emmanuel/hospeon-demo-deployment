import React, { useMemo, useState } from 'react';
import { ChevronRightIcon, RefreshCwIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { useVisits, useUpdateVisitStatus } from '@/features/queue/hooks/useVisitQueries';
import { VisitRecord, VisitStatus } from '@/services/visitService';
import { useAuthStore } from '@/features/auth/store/auth.store';

const humanizeStatus = (value: string) => value.replace(/_/g, ' ').toLowerCase();

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

const minutesWaiting = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.round(diff / 60000));
};

export function Queue() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VisitStatus | undefined>();
  const visitsQuery = useVisits({
    page: 1,
    limit: 50,
    status,
    date: new Date().toISOString().slice(0, 10),
  });
  const updateVisitStatus = useUpdateVisitStatus();

  const queue = visitsQuery.data?.data || [];
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return queue;

    return queue.filter((visit) => {
      const patientName = `${visit.patient.firstName} ${visit.patient.lastName}`.toLowerCase();
      return (
        patientName.includes(normalized) ||
        visit.patient.uhid.toLowerCase().includes(normalized) ||
        String(visit.tokenNumber).includes(normalized) ||
        (visit.doctor?.name || '').toLowerCase().includes(normalized)
      );
    });
  }, [queue, search]);

  const columns: Column<VisitRecord>[] = [
    {
      key: 'token',
      header: 'Token',
      width: '90px',
      render: (visit) => <MonoNumber weight="semibold">#{visit.tokenNumber}</MonoNumber>,
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (visit) => (
        <div>
          <div className="font-medium text-ink-primary dark:text-ink-primary-dark">
            {visit.patient.firstName} {visit.patient.lastName}
          </div>
          <MonoNumber size="xs" className="text-ink-tertiary">
            {visit.patient.uhid}
          </MonoNumber>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor',
      render: (visit) => <span className="text-ink-secondary">{visit.doctor?.name || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (visit) => <AutoStatusBadge status={humanizeStatus(visit.status)} />,
    },
    {
      key: 'wait',
      header: 'Wait time',
      render: (visit) => {
        const wait = minutesWaiting(visit.checkedInAt);
        return (
          <span className={wait > 30 ? 'text-warning font-medium' : 'text-ink-secondary'}>
            <MonoNumber size="sm">{wait}m</MonoNumber>
          </span>
        );
      },
    },
    {
      key: 'time',
      header: 'Checked in',
      render: (visit) => <MonoNumber size="sm">{formatTime(visit.checkedInAt)}</MonoNumber>,
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (visit) => (
        <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          {visit.status === 'WAITING' ? (
            <Button
              size="sm"
              variant="primary"
              disabled={updateVisitStatus.isPending}
              onClick={async () => {
                await updateVisitStatus.mutateAsync({ id: visit.id, status: 'IN_CONSULTATION' });
                navigate(`/visits/${visit.id}/consult`);
              }}>
              Start consultation
            </Button>
          ) : (
            <Button size="sm" variant="ghost" iconRight={<ChevronRightIcon />} onClick={() => navigate(`/visits/${visit.id}/consult`)}>
              Open
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Today's queue"
        description={user?.role === 'DOCTOR' ? 'Your live OPD queue for today.' : 'Live OPD queue across the clinic for today.'}
        breadcrumbs={[{ label: 'Overview' }, { label: "Today's queue" }]}
        actions={
          <Button variant="secondary" icon={<RefreshCwIcon />} onClick={() => visitsQuery.refetch()}>
            Refresh
          </Button>
        }
      />

      <Card>
        <FilterBar
          searchPlaceholder="Search by patient, UHID, token, or doctor"
          searchValue={search}
          onSearchChange={setSearch}>
          <button
            onClick={() => setStatus(undefined)}
            className={`h-9 px-3 rounded-lg text-xs font-medium ${!status ? 'bg-ink-primary text-white' : 'border border-line dark:border-line-dark text-ink-secondary'}`}>
            All
          </button>
          {(['WAITING', 'IN_CONSULTATION', 'COMPLETED'] as VisitStatus[]).map((value) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`h-9 px-3 rounded-lg text-xs font-medium ${
                status === value ? 'bg-ink-primary text-white' : 'border border-line dark:border-line-dark text-ink-secondary'
              }`}>
              {humanizeStatus(value)}
            </button>
          ))}
        </FilterBar>

        {visitsQuery.isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : visitsQuery.isError ? (
          <EmptyState
            title="Queue unavailable"
            description={(visitsQuery.error as { message?: string })?.message || 'The visit queue could not be loaded.'}
            action={
              <Button variant="primary" onClick={() => visitsQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusBadge tone="warning">Waiting: {queue.filter((visit) => visit.status === 'WAITING').length}</StatusBadge>
              <StatusBadge tone="info">In consultation: {queue.filter((visit) => visit.status === 'IN_CONSULTATION').length}</StatusBadge>
              <StatusBadge tone="success">Completed: {queue.filter((visit) => visit.status === 'COMPLETED').length}</StatusBadge>
            </div>

            <DataTable
              data={filtered}
              columns={columns}
              rowKey={(visit) => visit.id}
              onRowClick={(visit) => navigate(`/visits/${visit.id}/consult`)}
              emptyState={
                <EmptyState
                  title="No visits in queue"
                  description="There are no matching visits for the selected filters right now."
                />
              }
            />
          </>
        )}
      </Card>
    </div>
  );
}

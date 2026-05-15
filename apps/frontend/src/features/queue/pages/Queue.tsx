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
import { useVisits, useUpdateVisitStatus, useCreateVisit } from '@/features/queue/hooks/useVisitQueries';
import { VisitRecord, VisitStatus, VisitType } from '@/services/visitService';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { usePatients } from '@/features/patients/hooks/usePatientQueries';
import { PlusIcon, XIcon } from 'lucide-react';


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
  const createVisit = useCreateVisit();

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [checkInForm, setCheckInForm] = useState({
    patientId: '',
    visitType: 'OPD' as VisitType,
    doctorId: '',
    departmentId: '',
    chiefComplaint: '',
  });

  const { data: deptsQuery } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.list() });
  const { data: doctorsQuery } = useQuery({ queryKey: ['users', 'doctors'], queryFn: () => userService.listDoctors() });
  const patientLookup = usePatients({ search: patientSearch, limit: 5 });

  const departments = deptsQuery?.data || [];
  const doctors = doctorsQuery?.data || [];
  const patients = patientLookup.data?.data || [];

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
          <div className="flex gap-2">
            <Button variant="secondary" icon={<RefreshCwIcon />} onClick={() => visitsQuery.refetch()}>
              Refresh
            </Button>
            <Button variant="primary" icon={<PlusIcon />} onClick={() => setIsCheckingIn(true)}>
              Check in patient
            </Button>
          </div>
        }
      />

      {isCheckingIn && (
        <Card className="mb-6 border-accent/20 bg-accent-soft/10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <SectionTitle title="New patient check-in" description="Create a new OPD visit token for a registered patient." />
            <Button variant="ghost" size="sm" icon={<XIcon />} onClick={() => setIsCheckingIn(false)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">Patient lookup</label>
              <Input
                placeholder="Search by name or UHID..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              {patients.length > 0 && patientSearch.length > 1 && (
                <div className="mt-1 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark shadow-lg overflow-hidden">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-subtle/50 transition-colors ${checkInForm.patientId === p.id ? 'bg-accent-soft/30' : ''}`}
                      onClick={() => {
                        setCheckInForm({ ...checkInForm, patientId: p.id });
                        setPatientSearch(`${p.firstName} ${p.lastName} (${p.uhid})`);
                      }}>
                      <div className="font-medium">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-ink-tertiary">{p.uhid}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Select
              label="Visit type"
              value={checkInForm.visitType}
              onChange={(e) => setCheckInForm({ ...checkInForm, visitType: e.target.value as VisitType })}>
              <option value="OPD">OPD</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="IPD">IPD Admission</option>
            </Select>

            <Select
              label="Department"
              value={checkInForm.departmentId}
              onChange={(e) => setCheckInForm({ ...checkInForm, departmentId: e.target.value })}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Select
              label="Doctor"
              value={checkInForm.doctorId}
              onChange={(e) => setCheckInForm({ ...checkInForm, doctorId: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Input
              label="Chief complaint"
              className="lg:col-span-2"
              placeholder="Reason for visit..."
              value={checkInForm.chiefComplaint}
              onChange={(e) => setCheckInForm({ ...checkInForm, chiefComplaint: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCheckingIn(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!checkInForm.patientId || !checkInForm.doctorId || !checkInForm.departmentId || createVisit.isPending}
              onClick={async () => {
                await createVisit.mutateAsync(checkInForm);
                setIsCheckingIn(false);
                setCheckInForm({ patientId: '', visitType: 'OPD', doctorId: '', departmentId: '', chiefComplaint: '' });
                setPatientSearch('');
              }}>
              {createVisit.isPending ? 'Checking in...' : 'Issue token'}
            </Button>
          </div>
        </Card>
      )}

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

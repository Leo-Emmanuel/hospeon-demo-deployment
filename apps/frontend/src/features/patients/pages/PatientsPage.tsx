import React, { useEffect, useState } from 'react';
import { CalendarIcon, PhoneIcon, UserPlusIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { FilterBar, FilterChip } from '@/components/ui/FilterBar';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePatients } from '@/features/patients/hooks/usePatientQueries';
import { PatientListParams, PatientSummary } from '@/services/patientService';

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const formatGender = (value: PatientSummary['gender']) =>
  value === 'MALE' ? 'Male' : value === 'FEMALE' ? 'Female' : 'Other';

const getAge = (dob: string) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

const getPatientName = (patient: PatientSummary) => `${patient.firstName} ${patient.lastName}`.trim();

export function Patients() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<PatientListParams['gender']>();
  const [bloodGroup, setBloodGroup] = useState('');
  const [visitFrom, setVisitFrom] = useState('');
  const [visitTo, setVisitTo] = useState('');
  const [followUpToday, setFollowUpToday] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const todayIso = new Date().toISOString().split('T')[0];

  const queryParams: PatientListParams = {
    page,
    limit: 10,
    search,
    gender,
    bloodGroup: bloodGroup || undefined,
    visitFrom: visitFrom || undefined,
    visitTo: visitTo || undefined,
    followUpDate: followUpToday ? todayIso : undefined,
    sort: 'createdAt',
    order: 'desc',
  };

  const followUpQuery = usePatients({ followUpDate: todayIso, limit: 1 });
  const followUpCount = followUpQuery.data?.meta?.total || 0;

  const patientsQuery = usePatients(queryParams);
  const patients = patientsQuery.data?.data || [];
  const meta = patientsQuery.data?.meta;
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) || patients[0] || null;

  useEffect(() => {
    if (selectedPatient?.id !== selectedPatientId) {
      setSelectedPatientId(selectedPatient?.id || null);
    }
  }, [selectedPatient?.id, selectedPatientId]);

  const columns: Column<PatientSummary>[] = [
    {
      key: 'uhid',
      header: 'UHID',
      render: (patient) => (
        <MonoNumber size="sm" weight="medium">
          {patient.uhid}
        </MonoNumber>
      ),
    },
    {
      key: 'name',
      header: 'Patient',
      render: (patient) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-subtle dark:bg-subtle-dark flex items-center justify-center text-xs font-medium text-ink-secondary">
            {patient.firstName.charAt(0)}
            {patient.lastName.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-ink-primary dark:text-ink-primary-dark">
              {getPatientName(patient)}
            </div>
            <div className="text-xs text-ink-tertiary flex items-center gap-1 mt-0.5">
              <PhoneIcon className="w-3 h-3" />
              <MonoNumber size="xs">{patient.phone || 'No phone'}</MonoNumber>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'demographics',
      header: 'Age / Gender',
      render: (patient) => (
        <span className="text-sm text-ink-secondary">
          <MonoNumber size="sm">{getAge(patient.dob)}</MonoNumber> · {formatGender(patient.gender)}
        </span>
      ),
    },
    {
      key: 'bloodGroup',
      header: 'Blood',
      render: (patient) =>
        patient.bloodGroup ? <StatusBadge tone="neutral">{patient.bloodGroup}</StatusBadge> : '—',
    },
    {
      key: 'lastVisit',
      header: 'Last visit',
      render: (patient) => (
        <MonoNumber size="sm" className="text-ink-secondary">
          {formatDate(patient.visits?.[0]?.checkedInAt)}
        </MonoNumber>
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor',
      render: (patient) => (
        <span className="text-ink-secondary text-sm">{patient.visits?.[0]?.doctor?.name || '—'}</span>
      ),
    },
    {
      key: 'activePrescriptions',
      header: 'Rx',
      align: 'center',
      render: (patient) => (
        <MonoNumber size="sm">{patient.prescriptions?.length || 0}</MonoNumber>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Patients"
        description="Search and manage real patient records from the live hospital database."
        breadcrumbs={[{ label: 'Patients' }, { label: 'All patients' }]}
        actions={
          <Button variant="primary" icon={<UserPlusIcon />} onClick={() => navigate('/patients/register')}>
            Register New Patient
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <Card>
          <FilterBar
            searchPlaceholder="Search by UHID, name, phone, or email"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            rightActions={
              <Button variant="ghost" size="sm" onClick={() => {
                setGender(undefined);
                setBloodGroup('');
                setVisitFrom('');
                setVisitTo('');
                setFollowUpToday(false);
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}>
                Reset filters
              </Button>
            }>
            <FilterChip
              active={followUpToday}
              onClick={() => {
                setFollowUpToday(!followUpToday);
                setPage(1);
              }}
              count={followUpCount}>
              Follow-up today
            </FilterChip>
            <select
              value={gender || ''}
              onChange={(event) => {
                setGender((event.target.value || undefined) as PatientListParams['gender']);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm">
              <option value="">All genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={bloodGroup}
              onChange={(event) => {
                setBloodGroup(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm">
              <option value="">All blood groups</option>
              {bloodGroupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <label className="text-xs text-ink-secondary">
              Visit from
              <input
                type="date"
                value={visitFrom}
                onChange={(event) => {
                  setVisitFrom(event.target.value);
                  setPage(1);
                }}
                className="mt-1 block h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
              />
            </label>
            <label className="text-xs text-ink-secondary">
              Visit to
              <input
                type="date"
                value={visitTo}
                onChange={(event) => {
                  setVisitTo(event.target.value);
                  setPage(1);
                }}
                className="mt-1 block h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
              />
            </label>
          </FilterBar>

          {patientsQuery.isLoading ? (
            <LoadingSkeleton rows={8} />
          ) : patientsQuery.isError ? (
            <EmptyState
              title="Could not load patients"
              description={(patientsQuery.error as { message?: string })?.message || 'The patient list request failed.'}
              action={
                <Button variant="primary" onClick={() => patientsQuery.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <>
              <DataTable
                data={patients}
                columns={columns}
                rowKey={(patient) => patient.id}
                onRowClick={(patient) => {
                  setSelectedPatientId(patient.id);
                  navigate(`/patients/${patient.id}`);
                }}
                emptyState={
                  <EmptyState
                    title="No patients found"
                    description="Try a broader search or register a new patient."
                    action={
                      <Button variant="primary" onClick={() => navigate('/patients/register')}>
                        Register patient
                      </Button>
                    }
                  />
                }
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-line dark:border-line-dark">
                <span className="text-xs text-ink-tertiary">
                  Showing <MonoNumber size="xs">{patients.length}</MonoNumber> of{' '}
                  <MonoNumber size="xs">{meta?.total || patients.length}</MonoNumber> patients
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                    Previous
                  </Button>
                  <StatusBadge tone="neutral">
                    Page <MonoNumber size="xs">{meta?.page || page}</MonoNumber>
                  </StatusBadge>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!meta?.totalPages || page >= meta.totalPages}
                    onClick={() => setPage((value) => value + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card>
          <SectionTitle title="Quick View" description="Selected patient snapshot from the current results." />
          {!selectedPatient ? (
            <EmptyState compact title="No patient selected" description="Choose a patient row to preview their summary." />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-ink-primary dark:text-ink-primary-dark">
                  {getPatientName(selectedPatient)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <StatusBadge tone="neutral">{selectedPatient.uhid}</StatusBadge>
                  {selectedPatient.bloodGroup ? <StatusBadge tone="info">{selectedPatient.bloodGroup}</StatusBadge> : null}
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-tertiary">Age / Gender</dt>
                  <dd>
                    <MonoNumber size="sm">{getAge(selectedPatient.dob)}</MonoNumber> · {formatGender(selectedPatient.gender)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-tertiary">Phone</dt>
                  <dd className="text-right">{selectedPatient.phone || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-tertiary">Email</dt>
                  <dd className="text-right break-all">{selectedPatient.email || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-tertiary">Latest visit</dt>
                  <dd className="text-right">{formatDate(selectedPatient.visits?.[0]?.checkedInAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-tertiary">Assigned doctor</dt>
                  <dd className="text-right">{selectedPatient.visits?.[0]?.doctor?.name || '—'}</dd>
                </div>
              </dl>

              <div className="rounded-xl bg-subtle/60 dark:bg-subtle-dark/60 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-tertiary mb-2">Recent activity</p>
                {selectedPatient.visits?.[0] ? (
                  <div className="flex items-start gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 mt-0.5 text-accent" />
                    <div>
                      <p className="font-medium">{selectedPatient.visits[0].department?.name || selectedPatient.visits[0].visitType}</p>
                      <p className="text-ink-secondary">{selectedPatient.visits[0].chiefComplaint || 'No complaint recorded'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-ink-secondary">No visit history yet.</p>
                )}
              </div>

              <Button variant="primary" fullWidth onClick={() => navigate(`/patients/${selectedPatient.id}`)}>
                Open full profile
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

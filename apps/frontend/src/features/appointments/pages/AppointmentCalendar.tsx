import React, { useMemo, useState } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { useAppointments, useDepartments, useDoctors } from '@/features/appointments/hooks/useAppointmentQueries';
import { appointmentService, AppointmentRecord, AppointmentStatus } from '@/services/appointmentService';

export function AppointmentCalendar() {
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [doctorId, setDoctorId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const appointmentsQuery = useAppointments({
    status: status || undefined,
    doctorId: doctorId || undefined,
    departmentId: departmentId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 20,
  });
  const doctorsQuery = useDoctors();
  const departmentsQuery = useDepartments();

  const appointments = appointmentsQuery.data?.data || [];
  const doctors = doctorsQuery.data?.data || [];
  const departments = departmentsQuery.data?.data || [];

  const updateStatus = async (appointmentId: string, nextStatus: AppointmentStatus) => {
    await appointmentService.updateStatus(appointmentId, nextStatus);
    appointmentsQuery.refetch();
  };

  const columns: Column<AppointmentRecord>[] = useMemo(
    () => [
      {
        key: 'patient',
        header: 'Patient',
        render: (row) => (
          <div>
            <div className="font-medium">
              {row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '—'}
            </div>
            <div className="text-xs text-ink-tertiary">
              <MonoNumber>{row.patient?.uhid || row.patientId}</MonoNumber>
            </div>
          </div>
        ),
      },
      {
        key: 'doctor',
        header: 'Doctor',
        render: (row) => row.doctor?.name || '—',
      },
      {
        key: 'department',
        header: 'Department',
        render: (row) => row.department?.name || '—',
      },
      {
        key: 'time',
        header: 'Date & time',
        render: (row) => (
          <MonoNumber>
            {new Date(row.startAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </MonoNumber>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <StatusBadge tone="info" dot>{row.status.replace('_', ' ')}</StatusBadge>,
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            {row.status === 'PENDING' && (
              <Button size="sm" variant="secondary" onClick={() => updateStatus(row.id, 'CONFIRMED')}>Confirm</Button>
            )}
            {row.status === 'CONFIRMED' && (
              <Button size="sm" variant="secondary" onClick={() => updateStatus(row.id, 'CHECKED_IN')}>Check-in</Button>
            )}
            {row.status === 'CHECKED_IN' && (
              <Button size="sm" variant="secondary" onClick={() => updateStatus(row.id, 'IN_CONSULTATION')}>Start</Button>
            )}
            {row.status === 'IN_CONSULTATION' && (
              <Button size="sm" variant="secondary" onClick={() => updateStatus(row.id, 'COMPLETED')}>Complete</Button>
            )}
            {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
              <Button size="sm" variant="ghost" onClick={() => updateStatus(row.id, 'CANCELLED')}>Cancel</Button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Appointments"
        description="Calendar, slots, and doctor scheduling."
        breadcrumbs={[{ label: 'Appointments' }]}
        actions={
          <Button variant="ghost" icon={<RefreshCwIcon />} onClick={() => appointmentsQuery.refetch()}>
            Refresh
          </Button>
        }
      />

      <Card>
        <SectionTitle title="Filters" />
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as AppointmentStatus | '')}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked in</option>
            <option value="IN_CONSULTATION">In consultation</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No show</option>
          </select>
          <select
            className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
            value={doctorId}
            onChange={(event) => setDoctorId(event.target.value)}
          >
            <option value="">All doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              className="h-9 flex-1 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <input
              type="date"
              className="h-9 flex-1 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Appointment queue" description="Upcoming appointments and current queue state." />
        {appointmentsQuery.isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : appointmentsQuery.isError ? (
          <EmptyState
            title="Could not load appointments"
            description={(appointmentsQuery.error as { message?: string })?.message || 'Please try again.'}
            action={<Button variant="primary" onClick={() => appointmentsQuery.refetch()}>Retry</Button>}
          />
        ) : (
          <DataTable
            data={appointments}
            columns={columns}
            rowKey={(row) => row.id}
            emptyState={<EmptyState title="No appointments" description="No appointments match the current filters." />}
          />
        )}
      </Card>
    </div>
  );
}

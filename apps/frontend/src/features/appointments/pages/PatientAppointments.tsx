import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { Button } from '@/components/ui/Button';
import { CalendarPlusIcon } from 'lucide-react';
import { useMyAppointments } from '@/features/appointments/hooks/useAppointmentQueries';
import { AppointmentRecord, AppointmentStatus } from '@/services/appointmentService';

export function PatientAppointments() {
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const appointmentsQuery = useMyAppointments({ status: status || undefined, limit: 20 });
  const appointments = appointmentsQuery.data?.data || [];

  const columns: Column<AppointmentRecord>[] = useMemo(
    () => [
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
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="My appointments"
        description="Your upcoming and past appointments."
        breadcrumbs={[{ label: 'My appointments' }]}
        actions={
          <Link to="/appointments/new">
            <Button variant="primary">
              <CalendarPlusIcon className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        }
      />

      <Card>
        <SectionTitle title="Filters" />
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
      </Card>

      <Card>
        <SectionTitle title="Appointments" />
        {appointmentsQuery.isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : appointmentsQuery.isError ? (
          <EmptyState
            title="Could not load appointments"
            description={(appointmentsQuery.error as { message?: string })?.message || 'Please try again.'}
          />
        ) : (
          <DataTable
            data={appointments}
            columns={columns}
            rowKey={(row) => row.id}
            emptyState={<EmptyState title="No appointments" description="You do not have any appointments yet." />}
          />
        )}
      </Card>
    </div>
  );
}

import React from 'react';
import { StethoscopeIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { useDoctorWorkload } from '@/features/dashboard/hooks/useDashboardQueries';

export function DoctorPerformanceReport() {
  const workloadQuery = useDoctorWorkload();
  const workload = workloadQuery.data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor performance" description="Today's consultation workload from the live dashboard service." breadcrumbs={[{ label: 'Reports' }, { label: 'Doctors' }]} />

      <Card>
        <SectionTitle title="Consultations today" description="Live doctor workload counts from the dashboard API." />
        {workloadQuery.isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : workload.length === 0 ? (
          <EmptyState compact icon={<StethoscopeIcon />} title="No workload data" description="No doctor consultation workload was returned for today." />
        ) : (
          <DataTable
            data={workload}
            rowKey={(row) => row.doctorId}
            columns={[
              { key: 'doctorName', header: 'Doctor', render: (row) => <span className="font-medium">{row.doctorName}</span> },
              { key: 'doctorId', header: 'Doctor ID', render: (row) => <MonoNumber size="xs">{row.doctorId}</MonoNumber> },
              { key: 'consultationCount', header: 'Consultations today', align: 'right', render: (row) => <MonoNumber>{row.consultationCount}</MonoNumber> },
            ]}
          />
        )}
      </Card>
    </div>
  );
}

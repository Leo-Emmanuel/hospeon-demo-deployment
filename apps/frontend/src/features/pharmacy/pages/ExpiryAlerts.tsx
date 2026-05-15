import React from 'react';
import { AlertTriangleIcon, PillIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePharmacyWorklist } from '@/features/dashboard/hooks/useDashboardQueries';

export function ExpiryAlerts() {
  const worklistQuery = usePharmacyWorklist();
  const activePrescriptions = worklistQuery.data?.data || [];

  return (
    <div>
      <PageHeader
        title="Expiry alerts"
        description="Expiry tracking will be added when the pharmacy inventory module is available."
        breadcrumbs={[{ label: 'Pharmacy' }, { label: 'Expiry alerts' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          label="Active prescriptions"
          value={<MonoNumber>{activePrescriptions.length}</MonoNumber>}
          icon={<PillIcon className="w-4 h-4" />}
          hint="Based on the current active pharmacy worklist"
        />
        <Card>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
              <AlertTriangleIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Expiry tracking depends on pharmacy inventory</p>
              <p className="text-sm text-ink-secondary mt-1">
                Full batch expiry alerts require the pharmacy stock module. For now, this page shows live prescription activity only.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle title="Pharmacy worklist snapshot" description="Real active prescription activity from the backend." />
        {worklistQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : activePrescriptions.length === 0 ? (
          <EmptyState compact icon={<PillIcon />} title="No active prescriptions" description="There are no active prescriptions in the pharmacy worklist right now." />
        ) : (
          <div className="space-y-3">
            {activePrescriptions.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl border border-line dark:border-line-dark p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{item.drugName}</p>
                  <p className="text-sm text-ink-secondary mt-1">
                    {item.patient.firstName} {item.patient.lastName}
                  </p>
                  <p className="text-xs text-ink-tertiary mt-2">{item.consultation.doctor.name}</p>
                </div>
                <StatusBadge tone="info">Active</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

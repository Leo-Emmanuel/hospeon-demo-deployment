import React from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, ClipboardListIcon, ShoppingCartIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDashboardSummary, usePharmacyWorklist } from '@/features/dashboard/hooks/useDashboardQueries';
import { useUnreadNotifications } from '@/features/notifications/hooks/useNotificationQueries';

export function PharmacyDashboard() {
  const summaryQuery = useDashboardSummary();
  const worklistQuery = usePharmacyWorklist();
  const notificationsQuery = useUnreadNotifications();

  const summary = summaryQuery.data?.data as {
    prescriptionsToday?: number;
    activePrescriptionLines?: number;
    patientsOnActiveMedication?: number;
    opdVisitsToday?: number;
  } | undefined;
  const worklist = worklistQuery.data?.data || [];
  const notifications = notificationsQuery.data?.data || [];

  if (summaryQuery.isLoading && worklistQuery.isLoading) {
    return <LoadingSkeleton rows={10} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy dashboard"
        description="Live medication workload sourced from active prescriptions and the notification feed."
        actions={
          <>
            <Link to="/pharmacy/stock">
              <Button variant="secondary">Stock entry</Button>
            </Link>
            <Link to="/pharmacy/sales">
              <Button variant="primary">
                <ShoppingCartIcon className="w-4 h-4" />
                New sale
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Prescriptions today" value={<MonoNumber>{summary?.prescriptionsToday || 0}</MonoNumber>} icon={<ClipboardListIcon className="w-4 h-4" />} />
        <MetricCard label="Active medication lines" value={<MonoNumber>{summary?.activePrescriptionLines || 0}</MonoNumber>} icon={<ShoppingCartIcon className="w-4 h-4" />} />
        <MetricCard label="Patients on active meds" value={<MonoNumber>{summary?.patientsOnActiveMedication || 0}</MonoNumber>} icon={<UsersIcon className="w-4 h-4" />} />
        <MetricCard label="OPD visits today" value={<MonoNumber>{summary?.opdVisitsToday || 0}</MonoNumber>} icon={<ClipboardListIcon className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)] gap-6">
        <Card>
          <SectionTitle title="Medication worklist" description="Today&apos;s live prescription lines ready for pharmacist review and dispensing." />
          {worklistQuery.isLoading ? (
            <LoadingSkeleton rows={6} />
          ) : worklist.length === 0 ? (
            <EmptyState compact title="No active prescriptions today" description="No live prescription work items have been created yet." />
          ) : (
            <div className="space-y-3">
              {worklist.map((item) => (
                <div key={item.id} className="rounded-xl border border-line dark:border-line-dark p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {item.patient.firstName} {item.patient.lastName}
                        </p>
                        <MonoNumber size="xs" className="text-ink-tertiary">
                          {item.patient.uhid}
                        </MonoNumber>
                      </div>
                      <p className="text-sm text-ink-secondary mt-2">
                        {item.drugName} · {item.dosage} · {item.frequency} for {item.durationDays} days
                      </p>
                      <p className="text-xs text-ink-tertiary mt-2">
                        Ordered by {item.consultation.doctor.name}
                        {item.consultation.diagnosis ? ` · ${item.consultation.diagnosis}` : ''}
                      </p>
                      {item.instructions ? <p className="text-xs text-ink-secondary mt-2">{item.instructions}</p> : null}
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <StatusBadge tone="info">Active</StatusBadge>
                      <p className="text-xs text-ink-tertiary">{new Date(item.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle title="Unread alerts" description="Notifications affecting current pharmacist workflow." />
            {notificationsQuery.isLoading ? (
              <LoadingSkeleton rows={4} />
            ) : notifications.length === 0 ? (
              <EmptyState compact title="No unread alerts" description="There are no pharmacist notifications waiting right now." />
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 6).map((notification) => (
                  <div key={notification.id} className="rounded-xl border border-line dark:border-line-dark p-4">
                    <div className="flex items-start gap-3">
                      <BellIcon className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-ink-secondary mt-1">{notification.message}</p>
                        <p className="text-xs text-ink-tertiary mt-2">{new Date(notification.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="Fast actions" description="Common pharmacy routes that sit next to the live queue." />
            <div className="grid grid-cols-1 gap-3">
              <Link to="/pharmacy/medicines" className="rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40">
                <div className="font-medium">Medicines master</div>
                <p className="text-sm text-ink-secondary mt-1">Review current catalog, stock placeholders, and medicine setup.</p>
              </Link>
              <Link to="/pharmacy/purchase" className="rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40">
                <div className="font-medium">Purchase orders</div>
                <p className="text-sm text-ink-secondary mt-1">Move into procurement actions when today&apos;s prescription load climbs.</p>
              </Link>
              <Link to="/reports/pharmacy" className="rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40">
                <div className="font-medium">Pharmacy reports</div>
                <p className="text-sm text-ink-secondary mt-1">Open downstream reporting without leaving the operations dashboard flow.</p>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

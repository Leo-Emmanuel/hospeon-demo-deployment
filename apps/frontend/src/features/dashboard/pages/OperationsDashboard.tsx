import React from 'react';
import { Link } from 'react-router-dom';
import { ActivityIcon, BellIcon, ClipboardListIcon, CreditCardIcon, UsersIcon } from 'lucide-react';
import { Role } from '@hospeon/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';
import { useUnreadNotifications } from '@/features/notifications/hooks/useNotificationQueries';

export function OperationsDashboard() {
  const user = useAuthStore((state) => state.user);
  const summaryQuery = useDashboardSummary();
  const notificationsQuery = useUnreadNotifications();

  const isAccountant = user?.role === Role.ACCOUNTANT;
  const summary = summaryQuery.data?.data as {
    patientsToday?: number;
    opdVisitsToday?: number;
    pendingLabs?: number;
  } | undefined;
  const notifications = notificationsQuery.data?.data || [];

  if (summaryQuery.isLoading && notificationsQuery.isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAccountant ? 'Billing operations' : 'Operations overview'}
        description={
          isAccountant
            ? 'Live hospital activity with quick access to invoices, payments, and revenue reporting.'
            : 'A lightweight live snapshot for support staff and shared operations roles.'
        }
        actions={
          isAccountant ? (
            <>
              <Link to="/billing/invoices">
                <Button variant="secondary">Invoices</Button>
              </Link>
              <Link to="/reports/revenue">
                <Button variant="primary">Revenue report</Button>
              </Link>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Patients today" value={<MonoNumber>{summary?.patientsToday || 0}</MonoNumber>} icon={<UsersIcon className="w-4 h-4" />} />
        <MetricCard label="OPD visits" value={<MonoNumber>{summary?.opdVisitsToday || 0}</MonoNumber>} icon={<ClipboardListIcon className="w-4 h-4" />} />
        <MetricCard label="Pending labs" value={<MonoNumber>{summary?.pendingLabs || 0}</MonoNumber>} icon={<ActivityIcon className="w-4 h-4" />} />
        <MetricCard label="Unread alerts" value={<MonoNumber>{notifications.length}</MonoNumber>} icon={<BellIcon className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle
            title={isAccountant ? 'Billing shortcuts' : 'Support shortcuts'}
            description={isAccountant ? 'Move quickly between the highest-traffic finance areas.' : 'Jump into the operational areas you have access to.'}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isAccountant ? (
              <>
                <Link to="/billing/invoices" className="rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40">
                  <div className="font-medium">Invoices</div>
                  <p className="text-sm text-ink-secondary mt-1">Review and issue bills for current patient traffic.</p>
                </Link>
                <Link to="/billing/payments" className="rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40">
                  <div className="font-medium">Payments</div>
                  <p className="text-sm text-ink-secondary mt-1">Track collections and balance today&apos;s desk activity.</p>
                </Link>
                <Link to="/billing/refunds" className="rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40">
                  <div className="font-medium">Refunds</div>
                  <p className="text-sm text-ink-secondary mt-1">Handle corrections, cancellations, and patient adjustments.</p>
                </Link>
                <Link to="/reports/revenue" className="rounded-xl border border-line dark:border-line-dark p-4 hover:bg-subtle/40 dark:hover:bg-subtle-dark/40">
                  <div className="font-medium">Revenue report</div>
                  <p className="text-sm text-ink-secondary mt-1">Open the current billing report set for daily close review.</p>
                </Link>
              </>
            ) : (
              <div className="rounded-xl border border-line dark:border-line-dark p-4">
                <div className="font-medium">Shared operations role</div>
                <p className="text-sm text-ink-secondary mt-1">
                  This dashboard stays inside the endpoints your role can open safely, while still surfacing live system activity.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Unread notifications" description="Fresh alerts from the backend notification stream." />
          {notificationsQuery.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : notifications.length === 0 ? (
            <EmptyState compact title="No unread notifications" description="There are no new alerts for your account right now." />
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 6).map((notification) => (
                <div key={notification.id} className="rounded-xl border border-line dark:border-line-dark p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-ink-secondary mt-1">{notification.message}</p>
                    </div>
                    <CreditCardIcon className="w-4 h-4 text-ink-tertiary shrink-0" />
                  </div>
                  <p className="text-xs text-ink-tertiary mt-3">{new Date(notification.createdAt).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

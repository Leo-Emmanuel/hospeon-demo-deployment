import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircleIcon, ClockIcon, FlaskConicalIcon, PrinterIcon, TestTubeIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { useApproveLabResult, useLabOrders, useLabResult } from '@/features/laboratory/hooks/useLabQueries';
import { LabOrderRecord } from '@/services/labService';

const formatStatus = (value: string) => value.replace(/_/g, ' ').toLowerCase();

export function LabOrders({ category }: { category?: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTED' | 'APPROVED' | undefined>();
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT' | undefined>();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(category);
  const ordersQuery = useLabOrders({
    page: 1,
    limit: 50,
    status,
    priority,
    date,
    category: selectedCategory,
  });

  const orders = ordersQuery.data?.data || [];
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return orders;
    return orders.filter((order) => {
      const patientName = `${order.patient.firstName} ${order.patient.lastName}`.toLowerCase();
      return (
        patientName.includes(normalized) ||
        order.patient.uhid.toLowerCase().includes(normalized) ||
        order.testCatalog.name.toLowerCase().includes(normalized) ||
        order.id.toLowerCase().includes(normalized)
      );
    });
  }, [orders, search]);

  const columns: Column<LabOrderRecord>[] = [
    {
      key: 'id',
      header: 'Order',
      render: (order) => (
        <div>
          <MonoNumber size="sm" weight="medium">
            {order.id}
          </MonoNumber>
          <div className="text-xs text-ink-tertiary mt-1">{order.testCatalog.code}</div>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (order) => (
        <div>
          <div className="font-medium">
            {order.patient.firstName} {order.patient.lastName}
          </div>
          <MonoNumber size="xs" className="text-ink-tertiary">
            {order.patient.uhid}
          </MonoNumber>
        </div>
      ),
    },
    {
      key: 'test',
      header: 'Test',
      render: (order) => (
        <div>
          <div className="text-sm">{order.testCatalog.name}</div>
          <div className="text-xs text-ink-tertiary">{order.testCatalog.specimenType || 'Specimen not set'}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (order) => (
        <StatusBadge tone={order.priority === 'STAT' ? 'danger' : order.priority === 'URGENT' ? 'warning' : 'neutral'}>
          {order.priority}
        </StatusBadge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => <AutoStatusBadge status={formatStatus(order.status)} />,
    },
    {
      key: 'orderedBy',
      header: 'Ordered by',
      render: (order) => <span className="text-ink-secondary">{order.orderedByUser?.name || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (order) => (
        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          {order.status === 'PENDING' ? (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/lab/collection?orderId=${order.id}`)}>
              Collect sample
            </Button>
          ) : order.status === 'RESULTED' || order.status === 'APPROVED' ? (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/lab/reports?orderId=${order.id}`)}>
              {order.status === 'APPROVED' ? 'View report' : 'Review result'}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/lab/orders/${order.id}/results`)}>
              Enter results
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={category === 'Radiology' ? 'Radiology queue' : 'Lab queue'}
        description={category === 'Radiology' ? 'Live queue of radiology orders and imaging workflows.' : 'Live queue of pending and in-progress diagnostic work.'}
        breadcrumbs={[{ label: 'Diagnostics' }, { label: category === 'Radiology' ? 'Radiology queue' : 'Lab queue' }]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <MetricCard
          label="Samples pending"
          value={String(orders.filter((order) => order.status === 'PENDING').length)}
          icon={<TestTubeIcon />}
          tone="warning"
        />
        <MetricCard
          label="Processing"
          value={String(orders.filter((order) => ['SAMPLE_COLLECTED', 'PROCESSING'].includes(order.status)).length)}
          icon={<FlaskConicalIcon />}
        />
        <MetricCard
          label="Awaiting approval"
          value={String(orders.filter((order) => order.status === 'RESULTED').length)}
          icon={<ClockIcon />}
        />
        <MetricCard
          label="Abnormal flagged"
          value={String(orders.filter((order) => order.result?.isAbnormal).length)}
          icon={<AlertCircleIcon />}
          tone="danger"
        />
      </div>

      <Card>
        <FilterBar searchPlaceholder="Search order, patient, or test" searchValue={search} onSearchChange={setSearch}>
          <select
            value={status || ''}
            onChange={(event) =>
              setStatus(
                (event.target.value || undefined) as 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTED' | 'APPROVED' | undefined
              )
            }
            className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SAMPLE_COLLECTED">Sample collected</option>
            <option value="PROCESSING">Processing</option>
            <option value="RESULTED">Resulted</option>
            <option value="APPROVED">Approved</option>
          </select>
          <select
            value={priority || ''}
            onChange={(event) => setPriority((event.target.value || undefined) as 'ROUTINE' | 'URGENT' | 'STAT' | undefined)}
            className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm">
            <option value="">All priorities</option>
            <option value="STAT">Stat</option>
            <option value="URGENT">Urgent</option>
            <option value="ROUTINE">Routine</option>
          </select>
          {!category && (
            <select
              value={selectedCategory || ''}
              onChange={(event) => setSelectedCategory(event.target.value || undefined)}
              className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm">
              <option value="">All categories</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Hematology">Hematology</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Pathology">Pathology</option>
              <option value="Radiology">Radiology</option>
            </select>
          )}
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
          />
        </FilterBar>

        {ordersQuery.isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : ordersQuery.isError ? (
          <EmptyState
            title="Lab queue unavailable"
            description={(ordersQuery.error as { message?: string })?.message || 'The lab order list could not be loaded.'}
            action={
              <Button variant="primary" onClick={() => ordersQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(order) => order.id}
            onRowClick={(order) => navigate(`/lab/orders/${order.id}/results`)}
            emptyState={<EmptyState title="No lab orders found" description="There are no orders matching the current filters." />}
          />
        )}
      </Card>
    </div>
  );
}

export function LabReportReview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOrderId = searchParams.get('orderId') || '';
  const reviewOrdersQuery = useLabOrders({ page: 1, limit: 50, status: 'RESULTED' });
  const reviewOrders = reviewOrdersQuery.data?.data || [];
  const selectedOrder = reviewOrders.find((order) => order.id === selectedOrderId) || reviewOrders[0];
  const resultQuery = useLabResult(selectedOrder?.id || '');
  const approveResult = useApproveLabResult();
  const result = resultQuery.data?.data;

  useEffect(() => {
    if (!selectedOrderId && selectedOrder?.id) {
      setSearchParams({ orderId: selectedOrder.id });
    }
  }, [selectedOrder?.id, selectedOrderId, setSearchParams]);

  const handleApprove = async () => {
    if (!selectedOrder) return;
    await approveResult.mutateAsync(selectedOrder.id);
    await reviewOrdersQuery.refetch();
    await resultQuery.refetch();
  };

  if (reviewOrdersQuery.isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  if (reviewOrdersQuery.isError) {
    return (
      <EmptyState
        title="Review queue unavailable"
        description={(reviewOrdersQuery.error as { message?: string })?.message || 'The resulted lab queue could not be loaded.'}
        action={
          <Button variant="primary" onClick={() => reviewOrdersQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (reviewOrders.length === 0) {
    return <EmptyState title="No resulted lab reports" description="There are no lab results waiting for doctor approval right now." />;
  }

  if (resultQuery.isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (resultQuery.isError || !result || !selectedOrder) {
    return (
      <EmptyState
        title="Lab result unavailable"
        description={(resultQuery.error as { message?: string })?.message || 'The selected lab result could not be loaded.'}
        action={
          <Button variant="primary" onClick={() => resultQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Lab report review"
        description="Doctor approval queue for resulted laboratory reports."
        breadcrumbs={[{ label: 'Diagnostics', href: '/lab/queue' }, { label: 'Lab reports' }]}
        actions={
          <Button variant="secondary" onClick={() => navigate('/lab/queue')}>
            Back to lab queue
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
        <Card>
          <SectionTitle title="Awaiting approval" description={`${reviewOrders.length} resulted orders`} />
          <div className="space-y-2">
            {reviewOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSearchParams({ orderId: order.id })}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  order.id === selectedOrder.id
                    ? 'border-accent bg-accent-soft/40'
                    : 'border-line dark:border-line-dark hover:bg-subtle/60 dark:hover:bg-subtle-dark/60'
                }`}>
                <div className="flex items-center justify-between gap-3">
                  <MonoNumber size="xs">{order.id}</MonoNumber>
                  <StatusBadge tone={order.priority === 'STAT' ? 'danger' : order.priority === 'URGENT' ? 'warning' : 'neutral'}>
                    {order.priority}
                  </StatusBadge>
                </div>
                <p className="font-medium mt-2">
                  {order.patient.firstName} {order.patient.lastName}
                </p>
                <p className="text-sm text-ink-secondary mt-1">{order.testCatalog.name}</p>
                <p className="text-xs text-ink-tertiary mt-2">Ordered by {order.orderedByUser?.name || 'Unknown'}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <MonoNumber className="text-xs text-ink-tertiary">{selectedOrder.id}</MonoNumber>
                <h2 className="text-lg font-semibold mt-1">
                  {selectedOrder.patient.firstName} {selectedOrder.patient.lastName}
                </h2>
                <p className="text-sm text-ink-secondary mt-1">
                  {selectedOrder.testCatalog.name} · Ordered by {selectedOrder.orderedByUser?.name || 'Unknown'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AutoStatusBadge status={formatStatus(selectedOrder.status)} />
                {result.isAbnormal ? <StatusBadge tone="warning">Abnormal</StatusBadge> : <StatusBadge tone="success">Normal</StatusBadge>}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Result details" description="Review the technician-entered result before approval." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-line dark:border-line-dark p-4">
                <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Result</div>
                <div className="text-lg font-semibold">
                  <MonoNumber>{result.resultValue}</MonoNumber> {result.resultUnit || ''}
                </div>
              </div>
              <div className="rounded-xl border border-line dark:border-line-dark p-4">
                <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Reference range</div>
                <div>{result.referenceRange || 'Not provided'}</div>
              </div>
              <div className="rounded-xl border border-line dark:border-line-dark p-4">
                <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Technician</div>
                <div>{result.technician?.name || 'Unknown'}</div>
                <div className="text-xs text-ink-tertiary mt-1">
                  Entered {new Date(result.enteredAt).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="rounded-xl border border-line dark:border-line-dark p-4">
                <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Notes</div>
                <div>{result.notes || 'No technician notes recorded.'}</div>
              </div>
            </div>
          </Card>

          <Card className={result.isAbnormal ? 'border-warning/30 bg-warning-soft/30' : undefined}>
            <SectionTitle title="Approval decision" description="Approving will move the order to approved status and notify the ordering doctor if needed." />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-ink-secondary">
                {result.isAbnormal
                  ? 'This result is flagged abnormal. Double-check the value and context before approval.'
                  : 'This result is within the configured reference range.'}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" icon={<PrinterIcon />} disabled={!result.approvedAt} onClick={() => window.open(`/lab/reports/${selectedOrder.id}/print`, '_blank')}>
                  Print report
                </Button>
                <Button variant="primary" disabled={approveResult.isPending || Boolean(result.approvedAt)} onClick={handleApprove}>
                  {result.approvedAt ? 'Already approved' : approveResult.isPending ? 'Approving...' : 'Approve result'}
                </Button>
              </div>
            </div>
            {result.approvedAt ? (
              <p className="text-xs text-ink-tertiary mt-3">
                Approved by {result.approver?.name || 'Doctor'} on {new Date(result.approvedAt).toLocaleString('en-IN')}
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useLabOrder, useUpdateLabOrderStatus } from '@/features/laboratory/hooks/useLabQueries';

const tubeHint = (specimenType?: string | null) => {
  if (!specimenType) return 'Specimen type not configured';
  return specimenType;
};

export function SampleCollection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const [lookupOrderId, setLookupOrderId] = useState(orderId);
  const [notes, setNotes] = useState('');
  const [sampleCondition, setSampleCondition] = useState('Acceptable');
  const orderQuery = useLabOrder(orderId);
  const updateStatus = useUpdateLabOrderStatus();

  useEffect(() => {
    setLookupOrderId(orderId);
  }, [orderId]);

  const order = orderQuery.data?.data;

  const markCollected = async () => {
    if (!order) return;
    await updateStatus.mutateAsync({
      id: order.id,
      status: 'SAMPLE_COLLECTED',
      notes: notes.trim() ? `${sampleCondition}: ${notes.trim()}` : sampleCondition,
    });
    navigate(`/lab/orders/${order.id}/results`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sample collection"
        description="Verify the order, prepare the specimen, and move it into result-entry workflow."
        actions={
          <div className="flex gap-2">
            <Input value={lookupOrderId} onChange={(event) => setLookupOrderId(event.target.value)} placeholder="Enter order ID" mono />
            <Button
              variant="primary"
              onClick={() => {
                if (lookupOrderId.trim()) {
                  setSearchParams({ orderId: lookupOrderId.trim() });
                }
              }}>
              Lookup
            </Button>
          </div>
        }
      />

      {!orderId ? (
        <EmptyState title="No lab order selected" description="Open a pending lab order from the queue or look up an order ID." />
      ) : orderQuery.isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : orderQuery.isError || !order ? (
        <EmptyState
          title="Lab order unavailable"
          description={(orderQuery.error as { message?: string })?.message || 'The requested lab order could not be found.'}
          action={
            <Button variant="primary" onClick={() => orderQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-line dark:border-line-dark">
                <div>
                  <MonoNumber className="text-xs text-ink-tertiary">{order.id}</MonoNumber>
                  <div className="text-base font-semibold mt-1">
                    {order.patient.firstName} {order.patient.lastName}
                  </div>
                  <div className="text-xs text-ink-secondary">
                    <MonoNumber>{order.patient.uhid}</MonoNumber> · {order.testCatalog.name} · Ordered by {order.orderedByUser?.name || 'Unknown'}
                  </div>
                </div>
                <StatusBadge tone={order.priority === 'STAT' ? 'danger' : order.priority === 'URGENT' ? 'warning' : 'neutral'}>
                  {order.priority}
                </StatusBadge>
              </div>

              <SectionTitle title="Specimen requirements" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl border border-line dark:border-line-dark p-4">
                  <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Specimen type</div>
                  <div>{tubeHint(order.testCatalog.specimenType)}</div>
                </div>
                <div className="rounded-xl border border-line dark:border-line-dark p-4">
                  <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Reference range</div>
                  <div>
                    {order.testCatalog.referenceRangeLow || order.testCatalog.referenceRangeHigh
                      ? `${order.testCatalog.referenceRangeLow || '—'} - ${order.testCatalog.referenceRangeHigh || '—'}`
                      : 'Not configured'}
                  </div>
                </div>
                <div className="rounded-xl border border-line dark:border-line-dark p-4">
                  <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Turnaround</div>
                  <div>{order.testCatalog.turnaroundHours ? `${order.testCatalog.turnaroundHours} hrs` : 'Not configured'}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <SectionTitle title="Collection checklist" description="Update the order once the specimen is ready to process." />
              <div className="space-y-3">
                <StatusBadge tone="info">Current status: {order.status}</StatusBadge>
                <Input label="Collected by" value="Current technician" readOnly />
                <Input label="Collected at" value={new Date().toLocaleString('en-IN')} readOnly />
                <Select label="Sample condition" value={sampleCondition} onChange={(event) => setSampleCondition(event.target.value)}>
                  <option>Acceptable</option>
                  <option>Hemolyzed</option>
                  <option>Insufficient volume</option>
                  <option>Clotted</option>
                </Select>
                <Textarea
                  label="Collection notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Record any specimen-handling notes for the lab team."
                />
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => navigate('/lab/queue')}>
                Back to queue
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={updateStatus.isPending || order.status !== 'PENDING'}
                onClick={markCollected}>
                <CheckIcon className="w-4 h-4" />
                {updateStatus.isPending ? 'Updating...' : 'Mark collected'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

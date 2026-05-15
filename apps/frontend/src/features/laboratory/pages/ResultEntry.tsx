import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { Input, Textarea } from '@/components/ui/Input';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useEnterLabResult, useLabOrder, useLabResult, useUpdateLabOrderStatus, useUpdateLabResult } from '@/features/laboratory/hooks/useLabQueries';

const calculateIsAbnormal = (value: string, low?: string | null, high?: string | null) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return false;
  const lowNumeric = low !== null && low !== undefined ? Number(low) : undefined;
  const highNumeric = high !== null && high !== undefined ? Number(high) : undefined;
  if (lowNumeric !== undefined && Number.isFinite(lowNumeric) && numeric < lowNumeric) return true;
  if (highNumeric !== undefined && Number.isFinite(highNumeric) && numeric > highNumeric) return true;
  return false;
};

export function ResultEntry() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const orderQuery = useLabOrder(id);
  const resultQuery = useLabResult(id);
  const updateStatus = useUpdateLabOrderStatus();
  const enterResult = useEnterLabResult();
  const updateResult = useUpdateLabResult();
  const order = orderQuery.data?.data;
  const existingResult = resultQuery.data?.data;

  const [resultValue, setResultValue] = useState('');
  const [resultUnit, setResultUnit] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!order) return;
    setResultUnit(order.testCatalog.unit || '');
    setReferenceRange(
      order.testCatalog.referenceRangeLow || order.testCatalog.referenceRangeHigh
        ? `${order.testCatalog.referenceRangeLow || '—'} - ${order.testCatalog.referenceRangeHigh || '—'}`
        : ''
    );
  }, [order]);

  useEffect(() => {
    if (!existingResult) return;
    setResultValue(existingResult.resultValue);
    setResultUnit(existingResult.resultUnit || '');
    setReferenceRange(existingResult.referenceRange || '');
    setNotes(existingResult.notes || '');
  }, [existingResult]);

  const isAbnormal = useMemo(
    () => calculateIsAbnormal(resultValue, order?.testCatalog.referenceRangeLow, order?.testCatalog.referenceRangeHigh),
    [order?.testCatalog.referenceRangeHigh, order?.testCatalog.referenceRangeLow, resultValue]
  );

  const handleSubmit = async () => {
    if (!order) return;
    setSubmitError('');

    try {
      if (order.status === 'SAMPLE_COLLECTED') {
        await updateStatus.mutateAsync({ id: order.id, status: 'PROCESSING' });
      }

      const payload = {
        resultValue,
        resultUnit: resultUnit || undefined,
        referenceRange: referenceRange || undefined,
        isAbnormal,
        notes: notes || undefined,
      };

      if (existingResult) {
        await updateResult.mutateAsync({ orderId: order.id, payload });
      } else {
        await enterResult.mutateAsync({ orderId: order.id, payload });
      }

      navigate('/lab/queue');
    } catch (error) {
      setSubmitError((error as { message?: string })?.message || 'Could not save lab result');
    }
  };

  if (!id) {
    return <EmptyState title="No order selected" description="Open a lab order from the live queue to enter results." />;
  }

  if (orderQuery.isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  if (orderQuery.isError || !order) {
    return (
      <EmptyState
        title="Lab order unavailable"
        description={(orderQuery.error as { message?: string })?.message || 'The selected lab order could not be loaded.'}
        action={
          <Button variant="primary" onClick={() => orderQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Enter lab results"
        description={`${order.id} · ${order.patient.firstName} ${order.patient.lastName}`}
        breadcrumbs={[{ label: 'Laboratory', href: '/lab/queue' }, { label: 'Result entry' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6">
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Patient</div>
                <div className="font-medium">
                  {order.patient.firstName} {order.patient.lastName}
                </div>
                <MonoNumber className="text-xs text-ink-tertiary">{order.patient.uhid}</MonoNumber>
              </div>
              <div>
                <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Test</div>
                <div>{order.testCatalog.name}</div>
              </div>
              <div>
                <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Ordered by</div>
                <div>{order.orderedByUser?.name || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-tertiary uppercase tracking-wide mb-1">Status</div>
                <StatusBadge tone={order.status === 'RESULTED' ? 'success' : order.status === 'PROCESSING' ? 'warning' : 'info'}>
                  {order.status}
                </StatusBadge>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Result entry" description="Single-test result capture with server-side abnormal flag support." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Result value" value={resultValue} onChange={(event) => setResultValue(event.target.value)} mono />
              <Input label="Unit" value={resultUnit} onChange={(event) => setResultUnit(event.target.value)} />
              <Input label="Reference range" value={referenceRange} onChange={(event) => setReferenceRange(event.target.value)} />
              <Textarea
                label="Technician notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Sample condition, repeat tests, deviations..."
                className="md:col-span-3"
              />
            </div>
          </Card>

          {submitError ? (
            <Card className="border-danger/30 bg-danger-soft/40">
              <p className="text-sm text-danger">{submitError}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle title="Result checks" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-tertiary">Specimen</span>
                <span>{order.testCatalog.specimenType || 'Not configured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-tertiary">Reference range</span>
                <span>{referenceRange || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-tertiary">Abnormal flag</span>
                <StatusBadge tone={isAbnormal ? 'warning' : 'success'}>{isAbnormal ? 'Abnormal' : 'Normal'}</StatusBadge>
              </div>
              {existingResult?.approvedAt ? (
                <div className="rounded-xl bg-subtle/60 dark:bg-subtle-dark/60 p-3 text-xs text-ink-secondary">
                  Approved by {existingResult.approver?.name || 'Doctor'} on {new Date(existingResult.approvedAt).toLocaleString('en-IN')}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface dark:bg-surface-dark border-t border-line dark:border-line-dark px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 z-20">
        <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/lab/queue')}>
          Cancel
        </Button>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap sm:justify-end [&>*]:shrink-0">
          <Button variant="ghost" className="sm:hidden" onClick={() => navigate('/lab/queue')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!resultValue.trim() || enterResult.isPending || updateResult.isPending || updateStatus.isPending}>
            <CheckCircle2Icon className="w-4 h-4" />
            {enterResult.isPending || updateResult.isPending || updateStatus.isPending ? 'Saving...' : existingResult ? 'Update result' : 'Submit for approval'}
          </Button>
        </div>
      </div>
    </div>
  );
}

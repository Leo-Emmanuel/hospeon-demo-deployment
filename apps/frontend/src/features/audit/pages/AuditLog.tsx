import React, { useMemo, useState } from 'react';
import { FilterIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FilterBar, FilterChip } from '@/components/ui/FilterBar';
import { Select } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import { useAuditLogs } from '@/features/audit/hooks/useAuditQueries';
import { AuditLogRecord } from '@/services/auditService';

const toneFromAction = (action: string) => {
  const normalized = action.toUpperCase();
  if (normalized.includes('DELETE') || normalized.includes('CANCEL')) return 'warning';
  if (normalized.includes('APPROVE') || normalized.includes('COMPLETE')) return 'success';
  if (normalized.includes('CREATE')) return 'info';
  return 'neutral';
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function AuditLog() {
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const auditQuery = useAuditLogs({
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 100,
  });

  const entries = auditQuery.data?.data || [];
  const entityOptions = Array.from(new Set(entries.map((entry) => entry.entityType))).sort();
  const filteredEntries = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return entries;

    return entries.filter((entry) => {
      const actorName = entry.actor?.name?.toLowerCase() || '';
      return (
        actorName.includes(normalized) ||
        entry.action.toLowerCase().includes(normalized) ||
        entry.entityType.toLowerCase().includes(normalized) ||
        (entry.entityId || '').toLowerCase().includes(normalized) ||
        (entry.ipAddress || '').toLowerCase().includes(normalized)
      );
    });
  }, [entries, search]);

  const highImpactCount = entries.filter((entry) => toneFromAction(entry.action) === 'warning').length;
  const actionsInRange = entries.length;
  const uniqueActors = new Set(entries.map((entry) => entry.actor?.id).filter(Boolean)).size;

  const cols: Column<AuditLogRecord>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (entry) => (
        <MonoNumber size="xs" className="text-ink-secondary">
          {formatDateTime(entry.createdAt)}
        </MonoNumber>
      ),
    },
    {
      key: 'actor',
      header: 'User',
      render: (entry) => (
        <div>
          <div className="text-sm font-medium">{entry.actor?.name || 'System'}</div>
          <StatusBadge tone="neutral" size="sm">
            {entry.actor?.role || 'SYSTEM'}
          </StatusBadge>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (entry) => (
        <StatusBadge tone={toneFromAction(entry.action) as 'neutral' | 'warning' | 'success' | 'info'} size="sm">
          {entry.action}
        </StatusBadge>
      ),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (entry) => (
        <div>
          <div className="text-sm text-ink-secondary">{entry.entityType}</div>
          <MonoNumber size="xs">{entry.entityId || '—'}</MonoNumber>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP address',
      render: (entry) => <MonoNumber size="xs">{entry.ipAddress || '—'}</MonoNumber>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Immutable operational events pulled from the live backend for compliance and incident review."
        breadcrumbs={[{ label: 'Reports' }, { label: 'Audit logs' }]}
        actions={
          <>
            <Button variant="secondary" icon={<FilterIcon />}>
              Live filters
            </Button>
            <Button variant="primary" icon={<RefreshCwIcon />} onClick={() => auditQuery.refetch()}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <MetricCard label="Events in range" value={String(actionsInRange)} icon={<ShieldCheckIcon />} />
        <MetricCard label="High-impact actions" value={String(highImpactCount)} tone="warning" />
        <MetricCard label="Unique actors" value={String(uniqueActors)} />
        <MetricCard label="Retention" value="DB-backed" sublabel="live audit trail" />
      </div>

      <Card>
        <FilterBar
          searchPlaceholder="Search user, action, entity, ID, or IP..."
          searchValue={search}
          onSearchChange={setSearch}>
          <FilterChip active count={filteredEntries.length}>
            All
          </FilterChip>
          <FilterChip count={highImpactCount}>High-impact</FilterChip>
          <Select className="h-9 text-xs w-40" value={entityType} onChange={(event) => setEntityType(event.target.value)}>
            <option value="">All entities</option>
            {entityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 text-sm"
          />
        </FilterBar>

        {auditQuery.isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : auditQuery.isError ? (
          <EmptyState
            title="Audit log unavailable"
            description={(auditQuery.error as { message?: string })?.message || 'The audit log could not be loaded.'}
            action={
              <Button variant="primary" onClick={() => auditQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : (
          <DataTable
            data={filteredEntries}
            columns={cols}
            rowKey={(entry) => entry.id}
            dense
            emptyState={<EmptyState title="No audit events found" description="No audit events match the selected filters." />}
          />
        )}
      </Card>
    </div>
  );
}

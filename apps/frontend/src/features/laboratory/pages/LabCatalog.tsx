import React, { useState } from 'react';
import { PlusIcon, Edit2Icon, PowerIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Input';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useLabCatalog, useCreateCatalogItem, useUpdateCatalogItem, useToggleCatalogItem } from '@/features/laboratory/hooks/useLabQueries';
import { LabTestCatalogItem } from '@/services/labService';

export function LabCatalog() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LabTestCatalogItem>>({
    name: '',
    code: '',
    category: '',
    specimenType: '',
    unit: '',
    turnaroundHours: 24,
  });

  const catalogQuery = useLabCatalog({ showAll: true });
  const createItem = useCreateCatalogItem();
  const updateItem = useUpdateCatalogItem();
  const toggleItem = useToggleCatalogItem();

  const catalog = catalogQuery.data?.data || [];

  const handleEdit = (item: LabTestCatalogItem) => {
    setEditingId(item.id);
    setForm(item);
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await updateItem.mutateAsync({ id: editingId, payload: form });
    } else {
      await createItem.mutateAsync(form);
    }
    setIsEditing(false);
    setEditingId(null);
    setForm({ name: '', code: '', category: '', specimenType: '', unit: '', turnaroundHours: 24 });
  };

  const columns: Column<LabTestCatalogItem>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '120px',
      render: (item) => <MonoNumber weight="semibold">{item.code}</MonoNumber>,
    },
    {
      key: 'name',
      header: 'Test Name',
      render: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-ink-tertiary">{item.category || 'General'}</div>
        </div>
      ),
    },
    {
      key: 'specimen',
      header: 'Specimen',
      render: (item) => <span className="text-sm">{item.specimenType || '—'}</span>,
    },
    {
      key: 'range',
      header: 'Ref Range',
      render: (item) => (
        <span className="text-sm">
          {item.referenceRangeLow || '—'} - {item.referenceRangeHigh || '—'} {item.unit}
        </span>
      ),
    },
    {
      key: 'tat',
      header: 'TAT',
      width: '100px',
      render: (item) => <span className="text-sm">{item.turnaroundHours}h</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (item) => (
        <StatusBadge tone={item.isActive ? 'success' : 'neutral'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (item) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" icon={<Edit2Icon />} onClick={() => handleEdit(item)} />
          <Button 
            size="sm" 
            variant="ghost" 
            icon={<PowerIcon className={item.isActive ? 'text-danger' : 'text-success'} />} 
            onClick={() => toggleItem.mutate(item.id)} 
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lab tests catalog"
        description="Manage the master list of laboratory tests, reference ranges, and turnaround targets."
        breadcrumbs={[{ label: 'Diagnostics' }, { label: 'Lab catalog' }]}
        actions={
          <Button variant="primary" icon={<PlusIcon />} onClick={() => { setIsEditing(true); setEditingId(null); setForm({ name: '', code: '', category: '', specimenType: '', unit: '', turnaroundHours: 24 }); }}>
            Add new test
          </Button>
        }
      />

      {isEditing && (
        <Card className="border-accent/20 bg-accent-soft/10">
          <SectionTitle title={editingId ? 'Edit test' : 'Define new test'} description="Configure test identifiers, specimen requirements, and reference values." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Input label="Test name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Test code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Specimen type" value={form.specimenType || ''} onChange={(e) => setForm({ ...form, specimenType: e.target.value })} />
            <Input label="Ref range low" type="number" value={form.referenceRangeLow || ''} onChange={(e) => setForm({ ...form, referenceRangeLow: e.target.value })} />
            <Input label="Ref range high" type="number" value={form.referenceRangeHigh || ''} onChange={(e) => setForm({ ...form, referenceRangeHigh: e.target.value })} />
            <Input label="Unit" value={form.unit || ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input label="Turnaround (hours)" type="number" value={form.turnaroundHours || ''} onChange={(e) => setForm({ ...form, turnaroundHours: Number(e.target.value) })} />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={createItem.isPending || updateItem.isPending}>
              {editingId ? 'Update test' : 'Create test'}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {catalogQuery.isLoading ? (
          <LoadingSkeleton rows={10} />
        ) : catalog.length === 0 ? (
          <EmptyState title="No tests in catalog" description="Start by adding your first laboratory test." />
        ) : (
          <DataTable data={catalog} columns={columns} rowKey={(item) => item.id} />
        )}
      </Card>
    </div>
  );
}

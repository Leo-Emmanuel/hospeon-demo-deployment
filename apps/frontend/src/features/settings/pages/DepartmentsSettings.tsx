import React, { useState } from 'react';
import { PlusIcon, Edit2Icon, BuildingIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useDepartments, useCreateDepartment, useUpdateDepartment } from '@/features/settings/hooks/useSettingsQueries';
import { DepartmentRecord } from '@/services/departmentService';

export function DepartmentsSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const { data: departmentsResponse, isLoading } = useDepartments();
  const departments = departmentsResponse?.data || [];
  
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const handleEdit = (dept: DepartmentRecord) => {
    setEditingId(dept.id);
    setForm({ name: dept.name, description: dept.description || '' });
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, payload: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setIsEditing(false);
    setEditingId(null);
    setForm({ name: '', description: '' });
  };

  const columns: Column<DepartmentRecord>[] = [
    {
      key: 'name',
      header: 'Department Name',
      render: (dept) => (
        <div>
          <div className="font-medium">{dept.name}</div>
          <div className="text-xs text-ink-tertiary">{dept.description || 'No description'}</div>
        </div>
      ),
    },
    {
      key: 'head',
      header: 'Head of Department',
      render: (dept) => <span className="text-sm">{dept.headDoctor?.name || 'Not assigned'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (dept) => <span className="text-xs text-ink-secondary">{new Date(dept.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (dept) => (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" icon={<Edit2Icon />} onClick={() => handleEdit(dept)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage clinical and administrative departments."
        breadcrumbs={[{ label: 'Settings' }, { label: 'Departments' }]}
        actions={
          <Button variant="primary" icon={<PlusIcon />} onClick={() => { setIsEditing(true); setEditingId(null); setForm({ name: '', description: '' }); }}>
            Add department
          </Button>
        }
      />

      {isEditing && (
        <Card className="border-accent/20 bg-accent-soft/10">
          <SectionTitle title={editingId ? 'Edit department' : 'New department'} description="Clinical departments allow categorizing visits and staff." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update department' : 'Create department'}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : departments.length === 0 ? (
          <EmptyState icon={<BuildingIcon />} title="No departments found" description="Start by adding your first clinical department." />
        ) : (
          <DataTable data={departments} columns={columns} rowKey={(d) => d.id} />
        )}
      </Card>
    </div>
  );
}

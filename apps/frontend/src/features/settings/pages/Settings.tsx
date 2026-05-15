import React, { useState } from 'react';
import {
  PlusIcon,
  ShieldCheckIcon,
  SearchIcon,
  Edit2Icon,
  PowerIcon,
  UsersIcon,
  XIcon
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { useStaff, useCreateStaff, useUpdateStaff, useToggleStaffActive, useDepartments } from '@/features/settings/hooks/useSettingsQueries';
import { StaffRecord } from '@/services/userService';

export function Staff() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCTOR',
    departmentId: '',
  });

  const { data: staffResponse, isLoading } = useStaff();
  const staff = staffResponse?.data || [];
  
  const { data: deptsResponse } = useDepartments();
  const departments = deptsResponse?.data || [];

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const toggleMutation = useToggleStaffActive();

  const handleEdit = (member: StaffRecord) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      departmentId: member.departmentId || '',
    });
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
    setForm({ name: '', email: '', password: '', role: 'DOCTOR', departmentId: '' });
  };

  const columns: Column<StaffRecord>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (s) => (
        <div>
          <div className="font-medium">{s.name}</div>
          <div className="text-xs text-ink-tertiary">{s.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (s) => (
        <StatusBadge tone="neutral" size="sm">
          {s.role}
        </StatusBadge>
      ),
    },
    {
      key: 'dept',
      header: 'Department',
      render: (s) => <span className="text-sm text-ink-secondary">{s.department?.name || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <StatusBadge tone={s.isActive ? 'success' : 'neutral'} dot size="sm">
          {s.isActive ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (s) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" icon={<Edit2Icon />} onClick={() => handleEdit(s)} />
          <Button
            size="sm"
            variant="ghost"
            icon={<PowerIcon className={s.isActive ? 'text-danger' : 'text-success'} />}
            onClick={() => toggleMutation.mutate(s.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff management"
        description="Manage doctors, nurses, receptionists and all team members."
        breadcrumbs={[{ label: 'Settings' }, { label: 'Staff' }]}
        actions={
          <Button variant="primary" icon={<PlusIcon />} onClick={() => { setIsEditing(true); setEditingId(null); setForm({ name: '', email: '', password: '', role: 'DOCTOR', departmentId: '' }); }}>
            Add staff member
          </Button>
        }
      />

      {isEditing && (
        <Card className="border-accent/20 bg-accent-soft/10">
          <div className="flex items-start justify-between">
            <SectionTitle title={editingId ? 'Edit staff member' : 'New staff member'} description="Configure access and role for this employee." />
            <Button variant="ghost" size="sm" icon={<XIcon />} onClick={() => setIsEditing(false)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email Address *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {!editingId && (
              <Input label="Temporary Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            )}
            <Select label="Role *" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="NURSE">Nurse</option>
              <option value="LAB_TECHNICIAN">Lab Technician</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="ACCOUNTANT">Accountant</option>
            </Select>
            <Select label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update member' : 'Create member'}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <LoadingSkeleton rows={10} />
        ) : staff.length === 0 ? (
          <EmptyState icon={<UsersIcon />} title="No staff members found" description="Start by adding your first team member." />
        ) : (
          <DataTable data={staff} columns={columns} rowKey={(s) => s.id} />
        )}
      </Card>
    </div>
  );
}

export function RolesPermissions() {
  // Keeping the mock UI for now as role permissions logic is complex and usually static in MVP
  const modules = [
    'Patients', 'Appointments', 'Consultations', 'Prescriptions', 
    'Lab orders', 'Lab reports', 'Pharmacy', 'Invoices', 
    'Payments', 'Refunds', 'IPD admissions', 'Beds', 
    'Reports', 'Audit logs', 'Staff', 'Settings'
  ];

  const actions = ['View', 'Create', 'Edit', 'Delete', 'Export', 'Approve'];
  const [role, setRole] = useState('Doctor');
  const [roles, setRoles] = useState([
    'Admin', 'Doctor', 'Receptionist', 'Nurse', 
    'Pharmacist', 'Lab Technician', 'Accountant'
  ]);

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="Configure what each role can see and do across Hospeon."
        breadcrumbs={[{ label: 'Settings' }, { label: 'Roles & permissions' }]}
        actions={<Button variant="primary">Save changes</Button>}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <Card padded>
          <SectionTitle title="Roles" />
          <ul className="space-y-0.5">
            {roles.map((r) => (
              <li key={r}>
                <button
                  onClick={() => setRole(r)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                    role === r 
                      ? 'bg-subtle dark:bg-subtle-dark font-medium' 
                      : 'text-ink-secondary hover:bg-subtle/60 dark:hover:bg-subtle-dark/60'
                  }`}
                >
                  {r}
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-ink-tertiary" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle title={`${role} — permissions`} description="Toggle access for each module." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line dark:border-line-dark">
                  <th className="text-left py-2 text-xs font-medium uppercase tracking-wide text-ink-tertiary">Module</th>
                  {actions.map((a) => (
                    <th key={a} className="text-center py-2 text-xs font-medium uppercase tracking-wide text-ink-tertiary">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m} className="border-b border-line dark:border-line-dark last:border-0">
                    <td className="py-2.5 font-medium">{m}</td>
                    {actions.map((a) => (
                      <td key={a} className="text-center py-2.5">
                        <input type="checkbox" className="w-4 h-4 rounded border-line text-accent" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
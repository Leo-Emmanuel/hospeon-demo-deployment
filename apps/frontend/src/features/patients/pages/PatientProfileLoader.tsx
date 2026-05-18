import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePatients, useCreatePatient } from '@/features/patients/hooks/usePatientQueries';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/ui/EmptyState';
import { UserPlusIcon } from 'lucide-react';

export function PatientProfileLoader() {
  const { user } = useAuthStore();
  const patientsQuery = usePatients({ userId: user?.id });
  const patient = patientsQuery.data?.data?.[0];
  const createPatientMutation = useCreatePatient();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'FEMALE' as 'MALE' | 'FEMALE' | 'OTHER',
    phone: '',
    email: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Preset form fields when user data is available
  useEffect(() => {
    if (user) {
      const parts = (user.name || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      setForm((prev) => ({
        ...prev,
        firstName,
        lastName,
        email: user.email || '',
      }));
    }
  }, [user]);

  if (patientsQuery.isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="My Profile" description="Retrieving your patient profile..." />
        <Card>
          <LoadingSkeleton rows={6} />
        </Card>
      </div>
    );
  }

  // If patient profile is already found, redirect immediately to their profile
  if (patient) {
    return <Navigate to={`/patients/${patient.id}`} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.firstName || !form.lastName || !form.dob || !form.gender) {
      setErrorMsg('Please fill in all required fields (First name, Last name, Date of birth, Gender).');
      return;
    }

    try {
      await createPatientMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob,
        gender: form.gender,
        phone: form.phone || undefined,
        email: form.email || undefined,
        userId: user?.id, // Link to the logged in user
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not complete profile registration. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Complete your profile"
        description="To access clinic services and view your appointments, please complete your patient registration details below."
      />

      <Card>
        <SectionTitle title="Patient Information" description="All fields are required to register you in our medical system." />
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              required
              placeholder="e.g. Rahul"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            />
            <Input
              label="Last name"
              required
              placeholder="e.g. Sharma"
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of birth"
              type="date"
              required
              value={form.dob}
              onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))}
            />
            <Select
              label="Gender"
              required
              value={form.gender}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as any }))}
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone number (optional)"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              label="Email address"
              type="email"
              disabled
              value={form.email}
              hint="Your email address is linked to your account credentials."
            />
          </div>

          {errorMsg && (
            <div className="p-3 text-sm rounded-lg bg-danger-soft text-danger border border-danger/10">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-line dark:border-line-dark">
            <Button
              type="submit"
              variant="primary"
              disabled={createPatientMutation.isPending}
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              {createPatientMutation.isPending ? 'Registering...' : 'Register Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

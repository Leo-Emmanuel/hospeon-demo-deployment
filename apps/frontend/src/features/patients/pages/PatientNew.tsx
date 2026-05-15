import React, { useState } from 'react';
import { MailIcon, PhoneIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreatePatient } from '@/features/patients/hooks/usePatientQueries';
import { CreatePatientPayload } from '@/services/patientService';

type Step = 'personal' | 'contact' | 'insurance';

interface PatientFormState {
  firstName: string;
  lastName: string;
  dob: string;
  gender: CreatePatientPayload['gender'];
  bloodGroup: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyRelationship: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceMemberId: string;
  insurancePlanName: string;
}

const initialState: PatientFormState = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: 'MALE',
  bloodGroup: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyRelationship: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insuranceMemberId: '',
  insurancePlanName: '',
};

const steps: { id: Step; label: string; description: string }[] = [
  { id: 'personal', label: 'Personal', description: 'Identity and demographics' },
  { id: 'contact', label: 'Contact', description: 'Address and emergency contact' },
  { id: 'insurance', label: 'Insurance', description: 'Coverage and verification details' },
];

const buildPayload = (state: PatientFormState): CreatePatientPayload => ({
  firstName: state.firstName.trim(),
  lastName: state.lastName.trim(),
  dob: state.dob,
  gender: state.gender,
  bloodGroup: state.bloodGroup || undefined,
  phone: state.phone.trim() || undefined,
  email: state.email.trim() || undefined,
  address:
    state.addressLine1 || state.addressLine2 || state.city || state.state || state.postalCode
      ? {
          line1: state.addressLine1.trim() || undefined,
          line2: state.addressLine2.trim() || undefined,
          city: state.city.trim() || undefined,
          state: state.state.trim() || undefined,
          postalCode: state.postalCode.trim() || undefined,
        }
      : undefined,
  emergencyContact:
    state.emergencyContactName || state.emergencyContactPhone || state.emergencyRelationship
      ? {
          name: state.emergencyContactName.trim() || undefined,
          phone: state.emergencyContactPhone.trim() || undefined,
          relationship: state.emergencyRelationship.trim() || undefined,
        }
      : undefined,
  insuranceInfo:
    state.insuranceProvider || state.insurancePolicyNumber || state.insuranceMemberId || state.insurancePlanName
      ? {
          provider: state.insuranceProvider.trim() || undefined,
          policyNumber: state.insurancePolicyNumber.trim() || undefined,
          memberId: state.insuranceMemberId.trim() || undefined,
          planName: state.insurancePlanName.trim() || undefined,
        }
      : undefined,
});

export function PatientNew() {
  const navigate = useNavigate();
  const createPatient = useCreatePatient();
  const [step, setStep] = useState<Step>('personal');
  const [form, setForm] = useState<PatientFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof PatientFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateStep = (currentStep: Step) => {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 'personal') {
      if (!form.firstName.trim()) nextErrors.firstName = 'First name is required';
      if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required';
      if (!form.dob) nextErrors.dob = 'Date of birth is required';
      if (!form.gender) nextErrors.gender = 'Gender is required';
    }

    if (currentStep === 'contact') {
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        nextErrors.email = 'Enter a valid email';
      }
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const currentIndex = steps.findIndex((item) => item.id === step);

  const moveNext = () => {
    if (!validateStep(step)) return;
    const nextStep = steps[currentIndex + 1];
    if (nextStep) setStep(nextStep.id);
  };

  const moveBack = () => {
    const previousStep = steps[currentIndex - 1];
    if (previousStep) setStep(previousStep.id);
  };

  const handleSubmit = async () => {
    const allValid = steps.every((item) => validateStep(item.id));
    if (!allValid) return;

    try {
      const response = await createPatient.mutateAsync(buildPayload(form));
      navigate(`/patients/${response.data.id}`);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        form: (error as { message?: string })?.message || 'Patient registration failed',
      }));
    }
  };

  return (
    <div className="pb-24">
      <PageHeader
        title="New patient registration"
        description="Create a live patient record and route the team to the new profile immediately after save."
        breadcrumbs={[{ label: 'Patients', href: '/patients' }, { label: 'Register patient' }]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-4 max-w-6xl">
        <Card>
          <SectionTitle title="Registration steps" description="Complete each section before final submit." />
          <div className="space-y-2">
            {steps.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setStep(item.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  item.id === step
                    ? 'border-accent bg-accent-soft/50'
                    : 'border-line dark:border-line-dark hover:bg-subtle/60 dark:hover:bg-subtle-dark/60'
                }`}>
                <p className="text-xs uppercase tracking-wide text-ink-tertiary">Step {index + 1}</p>
                <p className="font-medium text-ink-primary dark:text-ink-primary-dark">{item.label}</p>
                <p className="text-sm text-ink-secondary">{item.description}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          {step === 'personal' ? (
            <Card>
              <SectionTitle title="Personal details" description="Core demographics used across visits, consultations, and prescriptions." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First name *"
                  value={form.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  icon={<UserIcon />}
                  error={errors.firstName}
                />
                <Input
                  label="Last name *"
                  value={form.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  error={errors.lastName}
                />
                <Input
                  label="Date of birth *"
                  type="date"
                  value={form.dob}
                  onChange={(event) => updateField('dob', event.target.value)}
                  error={errors.dob}
                />
                <Select
                  label="Gender *"
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                  error={errors.gender}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
                <Select
                  label="Blood group"
                  value={form.bloodGroup}
                  onChange={(event) => updateField('bloodGroup', event.target.value)}>
                  <option value="">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </Select>
              </div>
            </Card>
          ) : null}

          {step === 'contact' ? (
            <Card>
              <SectionTitle title="Contact and emergency details" description="This data feeds communication, billing, and intake workflows." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  icon={<PhoneIcon />}
                  mono
                />
                <Input
                  label="Email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  icon={<MailIcon />}
                  error={errors.email}
                />
                <Input
                  label="Address line 1"
                  value={form.addressLine1}
                  onChange={(event) => updateField('addressLine1', event.target.value)}
                  className="md:col-span-2"
                />
                <Input
                  label="Address line 2"
                  value={form.addressLine2}
                  onChange={(event) => updateField('addressLine2', event.target.value)}
                  className="md:col-span-2"
                />
                <Input label="City" value={form.city} onChange={(event) => updateField('city', event.target.value)} />
                <Input label="State" value={form.state} onChange={(event) => updateField('state', event.target.value)} />
                <Input
                  label="Postal code"
                  value={form.postalCode}
                  onChange={(event) => updateField('postalCode', event.target.value)}
                  mono
                />
                <div />
                <Input
                  label="Emergency contact name"
                  value={form.emergencyContactName}
                  onChange={(event) => updateField('emergencyContactName', event.target.value)}
                />
                <Input
                  label="Emergency contact phone"
                  value={form.emergencyContactPhone}
                  onChange={(event) => updateField('emergencyContactPhone', event.target.value)}
                  mono
                />
                <Input
                  label="Relationship"
                  value={form.emergencyRelationship}
                  onChange={(event) => updateField('emergencyRelationship', event.target.value)}
                />
              </div>
            </Card>
          ) : null}

          {step === 'insurance' ? (
            <Card>
              <SectionTitle title="Insurance details" description="Optional, but useful for reception and billing from day one." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Provider"
                  value={form.insuranceProvider}
                  onChange={(event) => updateField('insuranceProvider', event.target.value)}
                  icon={<ShieldIcon />}
                />
                <Input
                  label="Plan name"
                  value={form.insurancePlanName}
                  onChange={(event) => updateField('insurancePlanName', event.target.value)}
                />
                <Input
                  label="Policy number"
                  value={form.insurancePolicyNumber}
                  onChange={(event) => updateField('insurancePolicyNumber', event.target.value)}
                  mono
                />
                <Input
                  label="Member ID"
                  value={form.insuranceMemberId}
                  onChange={(event) => updateField('insuranceMemberId', event.target.value)}
                  mono
                />
                <Textarea
                  label="Registration notes"
                  className="md:col-span-2"
                  rows={3}
                  value={
                    form.insuranceProvider || form.insurancePlanName
                      ? 'Insurance details will be stored in the patient record for later verification.'
                      : ''
                  }
                  readOnly
                  hint="The current backend schema does not yet store separate registration-note text, so this area is informational for now."
                />
              </div>
            </Card>
          ) : null}

          {errors.form ? (
            <Card className="border-danger/30 bg-danger-soft/40">
              <p className="text-sm text-danger">{errors.form}</p>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur border-t border-line dark:border-line-dark px-4 lg:px-6 py-3 z-10">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-ink-tertiary hidden md:block">
            UHID is auto-generated on the server after successful registration.
          </p>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="ghost" onClick={() => navigate('/patients')}>
              Cancel
            </Button>
            <Button variant="secondary" disabled={currentIndex === 0} onClick={moveBack}>
              Back
            </Button>
            {currentIndex < steps.length - 1 ? (
              <Button variant="primary" onClick={moveNext}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} disabled={createPatient.isPending}>
                {createPatient.isPending ? 'Saving patient...' : 'Create patient'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

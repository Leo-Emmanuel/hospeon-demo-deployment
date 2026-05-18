import React, { useEffect, useState } from 'react';
import { AlertTriangleIcon, EditIcon, FlaskConicalIcon, PhoneIcon, SaveIcon, XIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Input';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { usePatient, useUpdatePatient } from '@/features/patients/hooks/usePatientQueries';
import { PatientDetail, UpdatePatientPayload, VisitSummary } from '@/services/patientService';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useApproveLabResult } from '@/features/laboratory/hooks/useLabQueries';

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const genderLabel = (value: PatientDetail['gender']) =>
  value === 'MALE' ? 'Male' : value === 'FEMALE' ? 'Female' : 'Other';

const ageFromDob = (dob: string) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

const patientName = (patient: PatientDetail) => `${patient.firstName} ${patient.lastName}`.trim();

const latestVisitVitals = (visits: VisitSummary[]) => {
  const latestVitals = visits[0]?.vitals;
  return latestVitals && typeof latestVitals === 'object' ? Object.entries(latestVitals) : [];
};

export function PatientProfile() {
  const { id = '' } = useParams();
  const patientQuery = usePatient(id);
  const patient = patientQuery.data?.data;
  const updatePatient = useUpdatePatient(id);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<UpdatePatientPayload>({});
  const [saveError, setSaveError] = useState('');
  const user = useAuthStore((state) => state.user);
  const approveResult = useApproveLabResult();

  useEffect(() => {
    if (!patient) return;
    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: patient.dob.slice(0, 10),
      gender: patient.gender,
      bloodGroup: patient.bloodGroup || undefined,
      phone: patient.phone || undefined,
      email: patient.email || undefined,
      address: {
        line1: patient.address?.line1 || '',
        line2: patient.address?.line2 || '',
        city: patient.address?.city || '',
        state: patient.address?.state || '',
        postalCode: patient.address?.postalCode || '',
      },
      emergencyContact: {
        name: patient.emergencyContact?.name || '',
        phone: patient.emergencyContact?.phone || '',
        relationship: patient.emergencyContact?.relationship || '',
      },
      insuranceInfo: {
        provider: patient.insuranceInfo?.provider || '',
        policyNumber: patient.insuranceInfo?.policyNumber || '',
        memberId: patient.insuranceInfo?.memberId || '',
        planName: patient.insuranceInfo?.planName || '',
      },
    });
  }, [patient]);

  const handleSave = async () => {
    setSaveError('');
    try {
      await updatePatient.mutateAsync(form);
      setIsEditing(false);
    } catch (error) {
      setSaveError((error as { message?: string })?.message || 'Could not save patient changes');
    }
  };

  if (patientQuery.isLoading) {
    return <LoadingSkeleton rows={10} />;
  }

  if (patientQuery.isError || !patient) {
    return (
      <EmptyState
        title="Patient profile unavailable"
        description={(patientQuery.error as { message?: string })?.message || 'The patient record could not be loaded.'}
        action={
          <Button variant="primary" onClick={() => patientQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const visits = patient.visits || [];
  const prescriptions = patient.prescriptions || [];
  const consultations = patient.consultations || [];
  const labOrders = patient.labOrders || [];
  const vitals = latestVisitVitals(visits);
  const formatStatus = (value: string) => value.replace(/_/g, ' ');

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={[{ label: 'Patients', href: '/patients' }, { label: patientName(patient) }]}
        title={patientName(patient)}
        meta={
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-secondary">
            <MonoNumber size="sm" weight="medium">
              {patient.uhid}
            </MonoNumber>
            <span>·</span>
            <span>
              <MonoNumber size="sm">{ageFromDob(patient.dob)}</MonoNumber> · {genderLabel(patient.gender)}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <PhoneIcon className="w-3 h-3" />
              <MonoNumber size="sm">{patient.phone || 'No phone'}</MonoNumber>
            </span>
            {patient.bloodGroup ? <StatusBadge tone="neutral">Blood: {patient.bloodGroup}</StatusBadge> : null}
          </div>
        }
        actions={
          isEditing ? (
            <>
              <Button variant="ghost" icon={<XIcon />} onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" icon={<SaveIcon />} onClick={handleSave} disabled={updatePatient.isPending}>
                {updatePatient.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </>
          ) : (
            <Button variant="secondary" icon={<EditIcon />} onClick={() => setIsEditing(true)}>
              Edit profile
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Demographics" description="Patient identity, contact information, and emergency details." />
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First name"
                  value={form.firstName || ''}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                />
                <Input
                  label="Last name"
                  value={form.lastName || ''}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={(form.dob as string) || ''}
                  onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
                />
                <Select
                  label="Gender"
                  value={form.gender || 'MALE'}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, gender: event.target.value as PatientDetail['gender'] }))
                  }>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
                <Input
                  label="Phone"
                  value={form.phone || ''}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
                <Input
                  label="Email"
                  value={form.email || ''}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
                <Input
                  label="Blood group"
                  value={form.bloodGroup || ''}
                  onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))}
                />
                <Input
                  label="Emergency contact name"
                  value={form.emergencyContact?.name || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      emergencyContact: { ...current.emergencyContact, name: event.target.value },
                    }))
                  }
                />
                <Input
                  label="Emergency contact phone"
                  value={form.emergencyContact?.phone || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      emergencyContact: { ...current.emergencyContact, phone: event.target.value },
                    }))
                  }
                />
                <Input
                  label="Relationship"
                  value={form.emergencyContact?.relationship || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      emergencyContact: { ...current.emergencyContact, relationship: event.target.value },
                    }))
                  }
                />
              </div>
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-ink-tertiary">DOB</dt>
                  <dd className="mt-1">{formatDate(patient.dob)}</dd>
                </div>
                <div>
                  <dt className="text-ink-tertiary">Email</dt>
                  <dd className="mt-1 break-all">{patient.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-tertiary">Address</dt>
                  <dd className="mt-1">
                    {patient.address?.line1 || patient.address?.city
                      ? [
                          patient.address?.line1,
                          patient.address?.line2,
                          patient.address?.city,
                          patient.address?.state,
                          patient.address?.postalCode,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-tertiary">Emergency contact</dt>
                  <dd className="mt-1">
                    {patient.emergencyContact?.name || patient.emergencyContact?.phone
                      ? `${patient.emergencyContact?.name || 'Unknown'} · ${patient.emergencyContact?.relationship || 'Relationship not set'} · ${patient.emergencyContact?.phone || 'No phone'}`
                      : '—'}
                  </dd>
                </div>
              </dl>
            )}
            {saveError ? <p className="mt-4 text-sm text-danger">{saveError}</p> : null}
          </Card>

          <Card>
            <SectionTitle title="Visit history timeline" description="Most recent visits pulled directly from the ERP backend." />
            {visits.length === 0 ? (
              <EmptyState compact title="No visits yet" description="This patient has not been checked in for a visit." />
            ) : (
              <div className="space-y-3">
                {visits.map((visit) => (
                  <div key={visit.id} className="rounded-xl border border-line dark:border-line-dark p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink-primary dark:text-ink-primary-dark">
                          {visit.department?.name || visit.visitType} · Token <MonoNumber size="sm">{visit.tokenNumber}</MonoNumber>
                        </p>
                        <p className="text-sm text-ink-secondary mt-1">{visit.chiefComplaint || 'No chief complaint recorded'}</p>
                        <p className="text-xs text-ink-tertiary mt-2">
                          {visit.doctor?.name || 'Doctor unassigned'} · Checked in {formatDateTime(visit.checkedInAt)}
                        </p>
                      </div>
                        <AutoStatusBadge status={formatStatus(visit.status)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="Active prescriptions" description="Live prescription rows linked to this patient." />
            {prescriptions.length === 0 ? (
              <EmptyState compact title="No active prescriptions" description="Prescriptions will appear here after consultation." />
            ) : (
              <div className="space-y-2">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="flex items-center justify-between gap-4 py-2 border-b border-line dark:border-line-dark last:border-0">
                    <div>
                      <p className="font-medium">{prescription.drugName}</p>
                      <p className="text-xs text-ink-tertiary">
                        {prescription.dosage} · {prescription.frequency} · {prescription.durationDays} days
                        {prescription.route ? ` · ${prescription.route}` : ''}
                      </p>
                    </div>
                    <StatusBadge tone="success" dot>
                      Active
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="Lab result summary" description="Recent lab orders and result status for doctor review." />
            {labOrders.length === 0 ? (
              <EmptyState compact title="No lab orders" description="Lab requests will appear here once they are created." />
            ) : (
              <div className="space-y-3">
                {labOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-line dark:border-line-dark p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink-primary dark:text-ink-primary-dark">
                          {order.testCatalog?.name || 'Lab test'} · {order.priority}
                        </p>
                        <p className="text-xs text-ink-tertiary mt-1">Ordered {formatDateTime(order.orderedAt)}</p>
                        {order.result ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">
                              Result: <MonoNumber size="sm">{order.result.resultValue}</MonoNumber>{' '}
                              {order.result.resultUnit || ''}
                              {order.result.referenceRange ? ` · Ref ${order.result.referenceRange}` : ''}
                            </p>
                            {order.result.approvedAt ? (
                              <div className="flex items-center gap-2 mt-2">
                                <StatusBadge tone="success">Approved</StatusBadge>
                                <span className="text-xs text-ink-secondary">by {order.result.approver?.name || 'Doctor'} on {formatDateTime(order.result.approvedAt)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-2">
                                <StatusBadge tone="warning">Awaiting approval</StatusBadge>
                                {user?.role === 'DOCTOR' && (
                                  <Button size="sm" variant="primary" disabled={approveResult.isPending} onClick={() => approveResult.mutateAsync(order.id)}>Approve</Button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm mt-2 text-ink-secondary">Result not entered yet.</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <AutoStatusBadge status={formatStatus(order.status)} />
                        {order.result?.isAbnormal ? <StatusBadge tone="warning">Abnormal</StatusBadge> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Patient overview" description="Fast intake summary for clinicians and reception." />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-tertiary">Registered</dt>
                <dd>{formatDate(patient.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-tertiary">Insurance</dt>
                <dd className="text-right">{patient.insuranceInfo?.provider || 'Self pay / not set'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-tertiary">Policy number</dt>
                <dd className="text-right">{patient.insuranceInfo?.policyNumber || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-tertiary">Last updated</dt>
                <dd className="text-right">{formatDateTime(patient.updatedAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <SectionTitle title="Latest vitals" description="Derived from the most recent visit payload." />
            {vitals.length === 0 ? (
              <EmptyState compact title="No vitals recorded" description="Visit vitals will show up here once staff capture them." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {vitals.map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-subtle/60 dark:bg-subtle-dark/60 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">{key}</p>
                    <p className="text-sm font-medium mt-1 break-words">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="border-warning/20 bg-warning-soft/30">
            <div className="flex items-start gap-3">
              <AlertTriangleIcon className="w-4 h-4 mt-0.5 text-warning" />
              <div>
                <p className="font-medium text-ink-primary dark:text-ink-primary-dark">Clinical note</p>
                <p className="text-sm text-ink-secondary mt-1">
                  {labOrders.some((order) => order.result?.isAbnormal)
                    ? 'One or more recent lab results are flagged abnormal and should be reviewed before the next consultation.'
                    : 'No abnormal lab flags are currently visible in the recent summary.'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Recent consultations" description="Diagnosis history from the most recent encounters." />
            {consultations.length === 0 ? (
              <EmptyState compact title="No consultations" description="Consultation records will appear here after the first doctor note." />
            ) : (
              <div className="space-y-3">
                {consultations.map((consultation) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const followUp = consultation.followUpDate ? new Date(consultation.followUpDate) : null;
                  if (followUp) followUp.setHours(0, 0, 0, 0);

                  let followUpBadge = null;
                  if (followUp) {
                    if (followUp >= today) {
                      followUpBadge = <StatusBadge tone="warning">Follow-up due {formatDate(consultation.followUpDate)}</StatusBadge>;
                    } else {
                      followUpBadge = <StatusBadge tone="danger">Follow-up overdue</StatusBadge>;
                    }
                  }

                  return (
                  <div key={consultation.id} className="rounded-xl border border-line dark:border-line-dark p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{consultation.diagnosis || 'Diagnosis pending'}</p>
                        <p className="text-xs text-ink-tertiary mt-1">{formatDate(consultation.createdAt)}</p>
                        <p className="text-sm text-ink-secondary mt-2">{consultation.clinicalNotes || 'No clinical notes recorded.'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {followUpBadge}
                        <div className="flex items-center gap-2">
                          <FlaskConicalIcon className="w-4 h-4 text-ink-tertiary" />
                          <AutoStatusBadge status={consultation.status} />
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

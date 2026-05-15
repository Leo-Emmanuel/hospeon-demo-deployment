import React, { useEffect, useMemo, useState } from 'react';
import { CheckIcon, FlaskConicalIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { useVisit, useUpdateVisitStatus, visitKeys } from '@/features/queue/hooks/useVisitQueries';
import {
  useCompleteVisit,
  useConsultation,
  useCreateConsultation,
  useLabTestsCatalog,
  useUpdateConsultation,
} from '@/features/consultations/hooks/useConsultationQueries';
import { PrescriptionPayload } from '@/services/consultationService';
import { queryClient } from '@/lib/react-query';
import { useToast } from '@/components/ui/Toast';

interface MedicationDraft extends PrescriptionPayload {
  localId: string;
}

interface LabOrderDraft {
  localId: string;
  testCatalogId: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  notes: string;
}

const createMedicationDraft = (): MedicationDraft => ({
  localId: crypto.randomUUID(),
  drugName: '',
  dosage: '',
  frequency: '',
  durationDays: 5,
  route: '',
  instructions: '',
});

const createLabOrderDraft = (): LabOrderDraft => ({
  localId: crypto.randomUUID(),
  testCatalogId: '',
  priority: 'ROUTINE',
  notes: '',
});

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

export function Consultation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id = '' } = useParams();
  const visitQuery = useVisit(id);
  const updateVisitStatus = useUpdateVisitStatus();
  const createConsultation = useCreateConsultation();
  const updateConsultation = useUpdateConsultation();
  const completeVisit = useCompleteVisit();
  const labTestsQuery = useLabTestsCatalog();
  const visit = visitQuery.data?.data;
  const consultationId = visit?.consultation?.id || '';
  const consultationQuery = useConsultation(consultationId);
  const consultation = consultationQuery.data?.data;

  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [medications, setMedications] = useState<MedicationDraft[]>([createMedicationDraft()]);
  const [labOrders, setLabOrders] = useState<LabOrderDraft[]>([]);

  useEffect(() => {
    if (!consultation) return;
    setDiagnosis(consultation.diagnosis || '');
    setDiagnosisCode(consultation.diagnosisCode || '');
    setClinicalNotes(consultation.clinicalNotes || '');
    setFollowUpDate(consultation.followUpDate ? consultation.followUpDate.slice(0, 10) : '');
    if (consultation.prescriptions.length > 0) {
      setMedications(
        consultation.prescriptions.map((item) => ({
          localId: item.id,
          drugName: item.drugName,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          route: item.route || '',
          instructions: item.instructions || '',
        }))
      );
    }
  }, [consultation]);

  const patient = visit?.patient;
  const labTests = labTestsQuery.data?.data || [];
  const isBusy =
    createConsultation.isPending ||
    updateConsultation.isPending ||
    completeVisit.isPending ||
    updateVisitStatus.isPending;

  const latestVitals = useMemo(() => {
    const vitals = visit?.vitals;
    return vitals && typeof vitals === 'object' ? Object.entries(vitals) : [];
  }, [visit?.vitals]);

  if (!id) {
    return (
      <EmptyState
        title="No visit selected"
        description="Open a patient from today's queue to begin a live consultation workflow."
        action={
          <Button variant="primary" onClick={() => navigate('/visits/today')}>
            Go to today's queue
          </Button>
        }
      />
    );
  }

  if (visitQuery.isLoading) {
    return <LoadingSkeleton rows={10} />;
  }

  if (visitQuery.isError || !visit || !patient) {
    return (
      <EmptyState
        title="Consultation unavailable"
        description={(visitQuery.error as { message?: string })?.message || 'The visit could not be loaded for consultation.'}
        action={
          <Button variant="primary" onClick={() => visitQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const ensureVisitInConsultation = async () => {
    if (visit.status === 'WAITING') {
      const response = await updateVisitStatus.mutateAsync({ id: visit.id, status: 'IN_CONSULTATION' });
      queryClient.setQueryData(visitKeys.detail(visit.id), response);
      return response.data;
    }
    return visit;
  };

  const ensureConsultation = async () => {
    if (consultation) return consultation;
    const response = await createConsultation.mutateAsync({
      visitId: visit.id,
      diagnosis,
      diagnosisCode: diagnosisCode || undefined,
      clinicalNotes,
      followUpDate: followUpDate || undefined,
    });
    queryClient.invalidateQueries({ queryKey: visitKeys.detail(visit.id) });
    return response.data;
  };

  const saveDraft = async () => {
    try {
      await ensureVisitInConsultation();
      const ensured = await ensureConsultation();
      await updateConsultation.mutateAsync({
        id: ensured.id,
        payload: {
          diagnosis,
          diagnosisCode: diagnosisCode || undefined,
          clinicalNotes: [clinicalNotes, generalAdvice].filter(Boolean).join('\n\n'),
          followUpDate: followUpDate || undefined,
        },
      });
      toast.success('Draft saved');
    } catch (error) {
      toast.error((error as { message?: string })?.message || 'Could not save consultation draft');
    }
  };

  const completeFlow = async () => {
    try {
      const validMeds = medications.filter(
        (item) => item.drugName.trim() && item.dosage.trim() && item.frequency.trim() && item.durationDays > 0
      );
      const validOrders = labOrders.filter((item) => item.testCatalogId);

      await completeVisit.mutateAsync({
        visitId: visit.id,
        diagnosis: diagnosis || undefined,
        diagnosisCode: diagnosisCode || undefined,
        clinicalNotes: [clinicalNotes, generalAdvice].filter(Boolean).join('\n\n') || undefined,
        followUpDate: followUpDate || undefined,
        prescriptions: validMeds.map(({ localId, ...rx }) => rx),
        labOrders: validOrders.map(({ localId, ...order }) => ({
          testCatalogId: order.testCatalogId,
          priority: order.priority,
          notes: order.notes || undefined,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Consultation completed');
      navigate('/queue');
    } catch (error) {
      toast.error((error as { message?: string })?.message || 'Failed to complete consultation');
      // Form is intentionally NOT cleared — doctor can fix and retry
    }
  };

  return (
    <div className="pb-24">
      <PageHeader
        title={`Consultation — ${patient.firstName} ${patient.lastName}`}
        breadcrumbs={[{ label: 'OPD' }, { label: "Today's queue", href: '/visits/today' }, { label: 'Consultation' }]}
        meta={
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-secondary">
            <MonoNumber size="sm" weight="medium">
              {patient.uhid}
            </MonoNumber>
            <span>·</span>
            <span>{visit.doctor?.name || 'Doctor unassigned'}</span>
            <span>·</span>
            <MonoNumber size="sm">Token {visit.tokenNumber}</MonoNumber>
            <AutoStatusBadge status={visit.status.replace(/_/g, ' ').toLowerCase()} />
          </div>
        }
        actions={
          <Button variant="secondary" onClick={() => navigate(`/patients/${patient.id}`)}>
            Open patient profile
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-4">
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Patient summary" />
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-ink-tertiary mb-1">Chief complaint</p>
                <p>{visit.chiefComplaint || 'No complaint recorded at check-in.'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-tertiary mb-1">Contact</p>
                <p>{patient.phone || patient.email || 'No contact details recorded'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-tertiary mb-1">Checked in</p>
                <p>{formatDateTime(visit.checkedInAt)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-tertiary mb-1">Latest vitals</p>
                {latestVitals.length === 0 ? (
                  <p className="text-ink-secondary">No vitals captured yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {latestVitals.map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-subtle/60 dark:bg-subtle-dark/60 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">{key}</p>
                        <p className="text-sm font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Assessment" description="Document the clinical decision for this visit." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="Chief complaint / history"
                rows={3}
                value={clinicalNotes}
                onChange={(event) => setClinicalNotes(event.target.value)}
                className="md:col-span-2"
              />
              <Input label="Diagnosis" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} />
              <Input
                label="ICD / diagnosis code"
                value={diagnosisCode}
                onChange={(event) => setDiagnosisCode(event.target.value)}
              />
              <Input
                label="Follow-up date"
                type="date"
                value={followUpDate}
                onChange={(event) => setFollowUpDate(event.target.value)}
              />
              <div />
              <Textarea
                label="Advice for patient"
                rows={3}
                value={generalAdvice}
                onChange={(event) => setGeneralAdvice(event.target.value)}
                className="md:col-span-2"
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              title="Prescriptions"
              description="Add one or more medications to be created in bulk."
              action={
                <Button size="sm" variant="secondary" icon={<PlusIcon />} onClick={() => setMedications((items) => [...items, createMedicationDraft()])}>
                  Add medicine
                </Button>
              }
            />
            <div className="space-y-3">
              {medications.map((medication) => (
                <div key={medication.localId} className="rounded-xl border border-line dark:border-line-dark p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <Input
                      label="Drug"
                      value={medication.drugName}
                      onChange={(event) =>
                        setMedications((items) =>
                          items.map((item) =>
                            item.localId === medication.localId ? { ...item, drugName: event.target.value } : item
                          )
                        )
                      }
                      className="md:col-span-2"
                    />
                    <Input
                      label="Dosage"
                      value={medication.dosage}
                      onChange={(event) =>
                        setMedications((items) =>
                          items.map((item) =>
                            item.localId === medication.localId ? { ...item, dosage: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Input
                      label="Frequency"
                      value={medication.frequency}
                      onChange={(event) =>
                        setMedications((items) =>
                          items.map((item) =>
                            item.localId === medication.localId ? { ...item, frequency: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Input
                      label="Duration (days)"
                      type="number"
                      min="1"
                      value={String(medication.durationDays)}
                      onChange={(event) =>
                        setMedications((items) =>
                          items.map((item) =>
                            item.localId === medication.localId
                              ? { ...item, durationDays: Number(event.target.value) || 1 }
                              : item
                          )
                        )
                      }
                    />
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2Icon />}
                        onClick={() =>
                          setMedications((items) => (items.length > 1 ? items.filter((item) => item.localId !== medication.localId) : items))
                        }>
                        Remove
                      </Button>
                    </div>
                    <Input
                      label="Route"
                      value={medication.route || ''}
                      onChange={(event) =>
                        setMedications((items) =>
                          items.map((item) =>
                            item.localId === medication.localId ? { ...item, route: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Input
                      label="Instructions"
                      value={medication.instructions || ''}
                      onChange={(event) =>
                        setMedications((items) =>
                          items.map((item) =>
                            item.localId === medication.localId ? { ...item, instructions: event.target.value } : item
                          )
                        )
                      }
                      className="md:col-span-3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              title="Lab orders"
              description="Choose tests from the live catalog and create them after consultation save."
              action={
                <Button size="sm" variant="secondary" icon={<FlaskConicalIcon />} onClick={() => setLabOrders((items) => [...items, createLabOrderDraft()])}>
                  Add test
                </Button>
              }
            />
            {labTestsQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : labOrders.length === 0 ? (
              <EmptyState compact title="No lab orders added" description="Add tests only when clinically needed." />
            ) : (
              <div className="space-y-3">
                {labOrders.map((order) => (
                  <div key={order.localId} className="rounded-xl border border-line dark:border-line-dark p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Select
                        label="Test"
                        value={order.testCatalogId}
                        onChange={(event) =>
                          setLabOrders((items) =>
                            items.map((item) =>
                              item.localId === order.localId ? { ...item, testCatalogId: event.target.value } : item
                            )
                          )
                        }
                        className="md:col-span-2">
                        <option value="">Select a test</option>
                        {labTests.map((test) => (
                          <option key={test.id} value={test.id}>
                            {test.name} ({test.code})
                          </option>
                        ))}
                      </Select>
                      <Select
                        label="Priority"
                        value={order.priority}
                        onChange={(event) =>
                          setLabOrders((items) =>
                            items.map((item) =>
                              item.localId === order.localId
                                ? { ...item, priority: event.target.value as LabOrderDraft['priority'] }
                                : item
                            )
                          )
                        }>
                        <option value="ROUTINE">Routine</option>
                        <option value="URGENT">Urgent</option>
                        <option value="STAT">Stat</option>
                      </Select>
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2Icon />}
                          onClick={() => setLabOrders((items) => items.filter((item) => item.localId !== order.localId))}>
                          Remove
                        </Button>
                      </div>
                      <Textarea
                        label="Order notes"
                        rows={2}
                        value={order.notes}
                        onChange={(event) =>
                          setLabOrders((items) =>
                            items.map((item) =>
                              item.localId === order.localId ? { ...item, notes: event.target.value } : item
                            )
                          )
                        }
                        className="md:col-span-4"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {consultation ? (
            <Card>
              <SectionTitle title="Existing consultation data" description="Current persisted consultation and related records." />
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="info">Consultation ID: {consultation.id}</StatusBadge>
                <StatusBadge tone={consultation.status === 'COMPLETED' ? 'success' : 'warning'}>
                  {consultation.status}
                </StatusBadge>
                <StatusBadge tone="neutral">Prescriptions: {consultation.prescriptions.length}</StatusBadge>
                <StatusBadge tone="neutral">Lab orders: {consultation.labOrders.length}</StatusBadge>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur border-t border-line dark:border-line-dark px-4 lg:px-6 py-3 z-10">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-ink-tertiary">
            Visit status: <AutoStatusBadge status={visit.status.replace(/_/g, ' ').toLowerCase()} />
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="secondary" onClick={saveDraft} disabled={isBusy}>
              Save draft
            </Button>
            <Button variant="primary" icon={<CheckIcon />} onClick={completeFlow} disabled={isBusy}>
              {isBusy ? 'Completing...' : 'Complete consultation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

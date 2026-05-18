import React, { useEffect, useMemo, useState } from 'react';
import { 
  CheckIcon, 
  FlaskConicalIcon, 
  PlusIcon, 
  Trash2Icon, 
  StethoscopeIcon, 
  ClipboardListIcon,
  ActivityIcon,
  BeakerIcon,
  SendIcon
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { useVisit, useUpdateVisitStatus } from '@/features/queue/hooks/useVisitQueries';
import { QK } from '@/lib/queryKeys';
import {
  useCompleteVisit,
  useConsultation,
  useCreateConsultation,
  useLabTestsCatalog,
  useUpdateConsultation,
  useCreateLabOrder,
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
  orderId?: string; // If placed
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
  const [activeTab, setActiveTab] = useState('assessment');
  
  const visitQuery = useVisit(id);
  const updateVisitStatus = useUpdateVisitStatus();
  const createConsultation = useCreateConsultation();
  const updateConsultation = useUpdateConsultation();
  const createLabOrder = useCreateLabOrder();
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
    if (consultation.labOrders.length > 0) {
      setLabOrders(
        consultation.labOrders.map((item) => ({
          localId: item.id,
          testCatalogId: item.testCatalog?.id || '',
          priority: item.priority as any,
          notes: item.notes || '',
          orderId: item.id,
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
    updateVisitStatus.isPending ||
    createLabOrder.isPending;

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

  const ensureConsultation = async () => {
    if (visit.status === 'WAITING') {
      await updateVisitStatus.mutateAsync({ id: visit.id, status: 'IN_CONSULTATION' });
    }
    
    if (consultationId) return consultationId;
    
    const response = await createConsultation.mutateAsync({
      visitId: visit.id,
      diagnosis,
      diagnosisCode: diagnosisCode || undefined,
      clinicalNotes,
      followUpDate: followUpDate || undefined,
    });
    queryClient.invalidateQueries({ queryKey: QK.visits.detail(visit.id) });
    return response.data.id;
  };

  const saveDraft = async () => {
    try {
      const cId = await ensureConsultation();
      await updateConsultation.mutateAsync({
        id: cId,
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

  const placeOrder = async (draft: LabOrderDraft) => {
    if (!draft.testCatalogId) {
      toast.error('Select a test first');
      return;
    }
    try {
      const cId = await ensureConsultation();
      const response = await createLabOrder.mutateAsync({
        visitId: visit.id,
        consultationId: cId,
        patientId: patient.id,
        testCatalogId: draft.testCatalogId,
        priority: draft.priority,
        notes: draft.notes || undefined,
      });
      
      setLabOrders(prev => prev.map(o => o.localId === draft.localId ? { ...o, orderId: response.data.id } : o));
      toast.success('Lab order placed successfully');
    } catch (error) {
      toast.error((error as { message?: string })?.message || 'Failed to place lab order');
    }
  };

  const completeFlow = async () => {
    try {
      const validMeds = medications.filter(
        (item) => item.drugName.trim() && item.dosage.trim() && item.frequency.trim() && item.durationDays > 0
      );
      const pendingOrders = labOrders.filter((item) => item.testCatalogId && !item.orderId);

      await completeVisit.mutateAsync({
        visitId: visit.id,
        diagnosis: diagnosis || undefined,
        diagnosisCode: diagnosisCode || undefined,
        clinicalNotes: [clinicalNotes, generalAdvice].filter(Boolean).join('\n\n') || undefined,
        followUpDate: followUpDate || undefined,
        prescriptions: validMeds.map(({ localId, ...rx }) => rx),
        labOrders: pendingOrders.map(({ localId, ...order }) => ({
          testCatalogId: order.testCatalogId,
          priority: order.priority,
          notes: order.notes || undefined,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      toast.success('Consultation completed');
      navigate('/queue');
    } catch (error) {
      toast.error((error as { message?: string })?.message || 'Failed to complete consultation');
    }
  };

  const tabs = [
    { id: 'assessment', label: 'Assessment', icon: <StethoscopeIcon /> },
    { id: 'prescriptions', label: 'Prescriptions', icon: <ClipboardListIcon /> },
    { id: 'diagnostics', label: 'Diagnostics', icon: <BeakerIcon /> },
  ];

  return (
    <div className="pb-24">
      <PageHeader
        title={`Consultation — ${patient.firstName} ${patient.lastName}`}
        breadcrumbs={[{ label: 'OPD' }, { label: "Today's queue", href: '/visits/today' }, { label: 'Consultation' }]}
        meta={
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-secondary">
            <MonoNumber size="sm" weight="medium">{patient.uhid}</MonoNumber>
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

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
        {/* Left Sidebar: Patient Info */}
        <aside className="space-y-4">
          <Card>
            <SectionTitle title="Patient summary" />
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-ink-tertiary mb-1">Chief complaint</p>
                <p className="font-medium">{visit.chiefComplaint || 'No complaint recorded.'}</p>
              </div>
              <div className="pt-3 border-t border-line dark:border-line-dark">
                <p className="text-xs text-ink-tertiary mb-2">Latest vitals</p>
                {latestVitals.length === 0 ? (
                  <p className="text-ink-tertiary italic">Not captured.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {latestVitals.map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-subtle/50 dark:bg-subtle-dark/50 p-2">
                        <p className="text-[10px] uppercase tracking-wider text-ink-tertiary">{key}</p>
                        <p className="font-semibold text-accent">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </aside>

        {/* Main Content: Tabs */}
        <main className="space-y-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'assessment' && (
            <Card padded>
              <SectionTitle title="Clinical assessment" description="Record observations, history and diagnosis." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Textarea
                  label="Clinical notes / history"
                  placeholder="Record patient history, symptoms and physical exam findings..."
                  rows={6}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="md:col-span-2"
                />
                <Input label="Provisional diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                <Input label="ICD code" value={diagnosisCode} onChange={(e) => setDiagnosisCode(e.target.value)} />
                <Input label="Follow-up date" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                <div />
                <Textarea
                  label="General advice"
                  placeholder="Lifestyle advice, diet, precautions..."
                  rows={3}
                  value={generalAdvice}
                  onChange={(e) => setGeneralAdvice(e.target.value)}
                  className="md:col-span-2"
                />
              </div>
            </Card>
          )}

          {activeTab === 'prescriptions' && (
            <Card padded>
              <SectionTitle 
                title="Prescriptions" 
                description="List medications for this visit."
                action={
                  <Button size="sm" variant="secondary" icon={<PlusIcon />} onClick={() => setMedications([...medications, createMedicationDraft()])}>
                    Add medicine
                  </Button>
                }
              />
              <div className="space-y-4 mt-4">
                {medications.map((med, idx) => (
                  <div key={med.localId} className="group relative rounded-xl border border-line dark:border-line-dark p-4 bg-surface dark:bg-surface-dark hover:shadow-md transition-all">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <Input
                        label="Drug name"
                        value={med.drugName}
                        onChange={(e) => setMedications(medications.map(m => m.localId === med.localId ? { ...m, drugName: e.target.value } : m))}
                        className="md:col-span-2"
                      />
                      <Input
                        label="Dosage"
                        placeholder="e.g. 500mg"
                        value={med.dosage}
                        onChange={(e) => setMedications(medications.map(m => m.localId === med.localId ? { ...m, dosage: e.target.value } : m))}
                      />
                      <Input
                        label="Frequency"
                        placeholder="e.g. 1-0-1"
                        value={med.frequency}
                        onChange={(e) => setMedications(medications.map(m => m.localId === med.localId ? { ...m, frequency: e.target.value } : m))}
                      />
                      <Input
                        label="Duration (days)"
                        type="number"
                        value={String(med.durationDays)}
                        onChange={(e) => setMedications(medications.map(m => m.localId === med.localId ? { ...m, durationDays: Number(e.target.value) } : m))}
                      />
                      <div className="flex items-end">
                        <Button size="sm" variant="ghost" className="text-danger" icon={<Trash2Icon />} onClick={() => setMedications(medications.filter(m => m.localId !== med.localId))} />
                      </div>
                      <Input
                        label="Instructions"
                        placeholder="After food, at bedtime etc."
                        value={med.instructions || ''}
                        onChange={(e) => setMedications(medications.map(m => m.localId === med.localId ? { ...m, instructions: e.target.value } : m))}
                        className="md:col-span-3"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'diagnostics' && (
            <Card padded>
              <SectionTitle 
                title="Lab orders" 
                description="Order investigations from the hospital catalog."
                action={
                  <Button size="sm" variant="secondary" icon={<PlusIcon />} onClick={() => setLabOrders([...labOrders, createLabOrderDraft()])}>
                    Add test row
                  </Button>
                }
              />
              <div className="space-y-4 mt-4">
                {labTestsQuery.isLoading ? (
                  <LoadingSkeleton rows={3} />
                ) : labOrders.length === 0 ? (
                  <EmptyState compact title="No tests ordered" description="Add a test row to begin ordering investigations." icon={<BeakerIcon />} />
                ) : (
                  labOrders.map((order) => (
                    <div key={order.localId} className={`rounded-xl border p-4 transition-all ${order.orderId ? 'border-success bg-success-soft/30' : 'border-line dark:border-line-dark bg-surface dark:bg-surface-dark'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Select
                          label="Test"
                          disabled={Boolean(order.orderId)}
                          value={order.testCatalogId}
                          onChange={(e) => setLabOrders(labOrders.map(o => o.localId === order.localId ? { ...o, testCatalogId: e.target.value } : o))}
                          className="md:col-span-2"
                        >
                          <option value="">Select test...</option>
                          {labTests.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                        </Select>
                        <Select
                          label="Priority"
                          disabled={Boolean(order.orderId)}
                          value={order.priority}
                          onChange={(e) => setLabOrders(labOrders.map(o => o.localId === order.localId ? { ...o, priority: e.target.value as any } : o))}
                        >
                          <option value="ROUTINE">Routine</option>
                          <option value="URGENT">Urgent</option>
                          <option value="STAT">STAT</option>
                        </Select>
                        <div className="flex items-end gap-2">
                          {!order.orderId ? (
                            <>
                              <Button size="sm" variant="primary" icon={<SendIcon />} onClick={() => placeOrder(order)} disabled={createLabOrder.isPending}>
                                Order
                              </Button>
                              <Button size="sm" variant="ghost" className="text-danger" icon={<Trash2Icon />} onClick={() => setLabOrders(labOrders.filter(o => o.localId !== order.localId))} />
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-success font-medium text-sm h-9">
                              <CheckIcon className="w-4 h-4" />
                              Placed: <MonoNumber size="xs">{order.orderId}</MonoNumber>
                            </div>
                          )}
                        </div>
                        <Textarea
                          label="Order notes"
                          disabled={Boolean(order.orderId)}
                          placeholder="Reason for ordering this test..."
                          value={order.notes}
                          onChange={(e) => setLabOrders(labOrders.map(o => o.localId === order.localId ? { ...o, notes: e.target.value } : o))}
                          className="md:col-span-4"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur border-t border-line dark:border-line-dark px-4 lg:px-6 py-4 z-10">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="hidden sm:block">
            <span className="text-xs text-ink-tertiary">Patient ID: </span>
            <MonoNumber size="sm">{patient.uhid}</MonoNumber>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={saveDraft} disabled={isBusy}>Save draft</Button>
            <Button variant="primary" icon={<CheckIcon />} onClick={completeFlow} disabled={isBusy}>
              {isBusy ? 'Saving...' : 'Complete consultation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

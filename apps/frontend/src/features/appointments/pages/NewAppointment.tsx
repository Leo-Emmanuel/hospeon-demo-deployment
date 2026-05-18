import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, UserPlusIcon, CalendarIcon } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { cn } from '@/lib/cn';
import { useCreatePatient, usePatients } from '@/features/patients/hooks/usePatientQueries';
import { useAppointmentSlots, useCreateAppointment, useDepartments, useDoctors } from '@/features/appointments/hooks/useAppointmentQueries';
import { AppointmentSlot, AppointmentType } from '@/services/appointmentService';

const formatSlot = (slot: AppointmentSlot) => {
  const start = new Date(slot.startAt);
  return start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const toIsoDate = (value?: string) => (value ? value : new Date().toISOString().split('T')[0]);

const appointmentTypeMap: Record<string, AppointmentType> = {
  consultation: 'NEW_CONSULTATION',
  followup: 'FOLLOW_UP',
  procedure: 'PROCEDURE',
  vaccination: 'VACCINATION',
};
export function NewAppointment() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPatient = user?.role === 'PATIENT';

  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'FEMALE',
    phone: '',
  });
  const [appointmentDate, setAppointmentDate] = useState(toIsoDate());
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [visitType, setVisitType] = useState('consultation');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');

  // Search existing patients for staff, or load self patient profile for patient role
  const patientsQuery = usePatients(
    isPatient ? { userId: user?.id } : { search: searchTerm, limit: 8 }
  );
  const patientsList = patientsQuery.data?.data || [];
  const selfPatient = isPatient ? patientsList[0] : null;

  const departmentsQuery = useDepartments();
  const doctorsQuery = useDoctors();
  const slotsQuery = useAppointmentSlots(doctorId || undefined, appointmentDate || undefined);
  const createAppointment = useCreateAppointment();
  const createPatient = useCreatePatient();

  const departments = departmentsQuery.data?.data || [];
  const doctors = doctorsQuery.data?.data || [];
  const slots = slotsQuery.data?.data || [];

  // Automatically select self-profile if logged in user is a patient
  useEffect(() => {
    if (isPatient && selfPatient) {
      setSelectedPatientId(selfPatient.id);
    }
  }, [isPatient, selfPatient]);

  const selectedPatient = useMemo(() => {
    if (isPatient && selfPatient) return selfPatient;
    return patientsList.find((patient) => patient.id === selectedPatientId) || null;
  }, [patientsList, selectedPatientId, isPatient, selfPatient]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [doctorId, appointmentDate]);

  const handleConfirm = async () => {
    let patientId = selectedPatientId || '';

    if (patientMode === 'new') {
      const [firstName, ...rest] = newPatient.firstName.trim().split(' ');
      const lastName = rest.join(' ') || newPatient.lastName.trim();
      const response = await createPatient.mutateAsync({
        firstName: firstName || newPatient.firstName,
        lastName: lastName || newPatient.lastName || 'Unknown',
        dob: newPatient.dob,
        gender: newPatient.gender as 'MALE' | 'FEMALE' | 'OTHER',
        phone: newPatient.phone || undefined,
      });
      patientId = response.data.id;
    }

    if (!patientId || !doctorId || !departmentId || !selectedSlot) {
      return;
    }

    await createAppointment.mutateAsync({
      patientId,
      doctorId,
      departmentId,
      appointmentType: appointmentTypeMap[visitType],
      reason: chiefComplaint || undefined,
      symptoms: chiefComplaint || undefined,
      notes: notes || undefined,
      startAt: selectedSlot.startAt,
      durationMinutes,
    });

    if (isPatient) {
      navigate('/my/appointments');
    } else {
      navigate('/calendar');
    }
  };
  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title={isPatient ? 'Book an appointment' : 'New appointment'}
        breadcrumbs={
          isPatient
            ? [{ label: 'My appointments', to: '/my/appointments' }, { label: 'Book appointment' }]
            : [{ label: 'Calendar', to: '/calendar' }, { label: 'New appointment' }]
        }
      />
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Patient */}
          <Card>
            {isPatient ? (
              <>
                <SectionTitle
                  title="Patient profile"
                  description="Your linked patient information for this booking"
                />
                {patientsQuery.isLoading ? (
                  <div className="animate-pulse space-y-3 mt-4">
                    <div className="h-10 bg-line dark:bg-line-dark rounded-xl"></div>
                  </div>
                ) : selectedPatient ? (
                  <div className="rounded-xl border border-accent bg-accent-soft/40 p-4 flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-semibold">
                      {selectedPatient.firstName.charAt(0)}
                      {selectedPatient.lastName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink-primary dark:text-ink-primary-dark">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </div>
                      <div className="text-xs text-ink-tertiary">
                        <MonoNumber>{selectedPatient.uhid}</MonoNumber> · {selectedPatient.phone || 'No phone'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 rounded-lg bg-danger-soft text-danger text-sm">
                    No linked patient profile found. Please create your profile in "My Profile" first.
                  </div>
                )}
              </>
            ) : (
              <>
                <SectionTitle
                  title="Patient"
                  description="Search existing or register a new one"
                />
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setPatientMode('existing')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm',
                      patientMode === 'existing' ?
                      'bg-accent text-white' :
                      'bg-subtle dark:bg-subtle-dark text-ink-secondary'
                    )}>
                    
                    Existing patient
                  </button>
                  <button
                    onClick={() => setPatientMode('new')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm',
                      patientMode === 'new' ?
                      'bg-accent text-white' :
                      'bg-subtle dark:bg-subtle-dark text-ink-secondary'
                    )}>
                    
                    New patient
                  </button>
                </div>
                {patientMode === 'existing' ?
                <div className="space-y-3">
                    <Input
                    placeholder="Search by name, phone, or patient ID…"
                    icon={<SearchIcon className="w-4 h-4" />}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)} />

                    {selectedPatient ? (
                      <div className="rounded-xl border border-accent bg-accent-soft/40 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-semibold">
                          {selectedPatient.firstName.charAt(0)}
                          {selectedPatient.lastName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-ink-primary dark:text-ink-primary-dark">
                            {selectedPatient.firstName} {selectedPatient.lastName}
                          </div>
                          <div className="text-xs text-ink-tertiary">
                            <MonoNumber>{selectedPatient.uhid}</MonoNumber> · {selectedPatient.phone || 'No phone'}
                          </div>
                        </div>
                        <Button variant="ghost" className="!py-1 !px-2 text-xs" onClick={() => setSelectedPatientId(null)}>
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="rounded-xl border border-line dark:border-line-dark p-3 text-xs text-ink-tertiary">
                          Search and select a patient from the list.
                        </div>
                        {patientsList.length > 0 ? (
                          <div className="rounded-xl border border-line dark:border-line-dark divide-y divide-line dark:divide-line-dark">
                            {patientsList.map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => setSelectedPatientId(patient.id)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-subtle dark:hover:bg-subtle-dark"
                              >
                                <div className="font-medium">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <div className="text-xs text-ink-tertiary">
                                  <MonoNumber>{patient.uhid}</MonoNumber> · {patient.phone || 'No phone'}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div> :

                <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" required placeholder="Patient name" value={newPatient.firstName} onChange={(event) => setNewPatient((current) => ({ ...current, firstName: event.target.value }))} />
                    <Input label="Last name" required placeholder="Patient surname" value={newPatient.lastName} onChange={(event) => setNewPatient((current) => ({ ...current, lastName: event.target.value }))} />
                    <Input label="Phone" required placeholder="+91" mono value={newPatient.phone} onChange={(event) => setNewPatient((current) => ({ ...current, phone: event.target.value }))} />
                    <Input label="Date of birth" type="date" mono value={newPatient.dob} onChange={(event) => setNewPatient((current) => ({ ...current, dob: event.target.value }))} />
                    <Select label="Gender" value={newPatient.gender} onChange={(event) => setNewPatient((current) => ({ ...current, gender: event.target.value }))}>
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </Select>
                    <div className="col-span-2 flex items-center gap-2 text-xs text-ink-tertiary">
                      <UserPlusIcon className="w-3.5 h-3.5" /> Full registration can
                      be completed later from the patient profile.
                    </div>
                  </div>
                }
              </>
            )}
          </Card>

          {/* Appointment */}
          <Card>
            <SectionTitle title="Appointment" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Select label="Department" required value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
              <Select label="Doctor" required value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Date"
                type="date"
                required
                value={appointmentDate}
                onChange={(event) => setAppointmentDate(event.target.value)}
                mono />

              <Select label="Duration" value={String(durationMinutes)} onChange={(event) => setDurationMinutes(Number(event.target.value))}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark mb-2">
                Available slots
              </label>
              {slotsQuery.isLoading ? (
                <div className="rounded-xl border border-line dark:border-line-dark p-3 text-xs text-ink-tertiary">
                  Loading slots...
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-line dark:border-line-dark p-3 text-xs text-ink-tertiary">
                  No slots available for this doctor on the selected date.
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {slots.map((slot) => {
                    const isBooked = slot.status === 'BOOKED';
                    const isBlocked = slot.status === 'BLOCKED';
                    const isSelected = selectedSlot?.startAt === slot.startAt;
                    return (
                      <button
                        key={slot.startAt}
                        type="button"
                        disabled={isBooked || isBlocked}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          'px-2 py-2 rounded-lg text-xs font-mono border transition-colors',
                          isSelected && 'bg-accent text-white border-accent',
                          !isSelected &&
                          !isBooked &&
                          !isBlocked &&
                          'border-line dark:border-line-dark hover:border-accent text-ink-primary dark:text-ink-primary-dark',
                          isBooked &&
                          'border-line dark:border-line-dark bg-subtle dark:bg-subtle-dark text-ink-tertiary line-through cursor-not-allowed',
                          isBlocked &&
                          'border-dashed border-line dark:border-line-dark text-ink-tertiary cursor-not-allowed'
                        )}>
                        {formatSlot(slot)}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-4 mt-3 text-xs text-ink-tertiary">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded border border-line" />{' '}
                  Available
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-accent" /> Selected
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-subtle dark:bg-subtle-dark" />{' '}
                  Booked
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded border border-dashed border-line" />{' '}
                  Blocked (lunch)
                </div>
              </div>
            </div>
          </Card>

          {/* Visit details */}
          <Card>
            <SectionTitle title="Visit details" />
            <div className="space-y-3">
              <Select label="Visit type" value={visitType} onChange={(event) => setVisitType(event.target.value)}>
                <option value="consultation">New consultation</option>
                <option value="followup">Follow-up</option>
                <option value="procedure">Procedure</option>
                <option value="vaccination">Vaccination</option>
              </Select>
              <Input
                label="Chief complaint"
                placeholder="e.g. Chest discomfort on exertion, 2 days"
                value={chiefComplaint}
                onChange={(event) => setChiefComplaint(event.target.value)} />
              
              <Textarea
                label="Notes for the doctor (optional)"
                rows={3}
                placeholder="Anything the doctor should know before the visit…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)} />
              
            </div>
          </Card>

          {/* Communication */}
          <Card>
            <SectionTitle title="Reminders" />
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>SMS reminder · 24 hrs before</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>WhatsApp reminder · 2 hrs before</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" />
                <span>Email reminder</span>
              </label>
            </div>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <SectionTitle title="Summary" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">
                  Patient
                </span>
                <span className="text-ink-primary dark:text-ink-primary-dark">
                  {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">
                  Patient ID
                </span>
                <MonoNumber>{selectedPatient?.uhid || '—'}</MonoNumber>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">
                  Doctor
                </span>
                <span className="text-ink-primary dark:text-ink-primary-dark">
                  {doctors.find((doctor) => doctor.id === doctorId)?.name || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">
                  Department
                </span>
                <span>{departments.find((department) => department.id === departmentId)?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">
                  Date & time
                </span>
                <MonoNumber>{appointmentDate} · {selectedSlot ? formatSlot(selectedSlot) : '—'}</MonoNumber>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">
                  Duration
                </span>
                <MonoNumber>{durationMinutes} min</MonoNumber>
              </div>
              <div className="border-t border-line dark:border-line-dark pt-3 flex justify-between font-medium">
                <span>Consultation fee</span>
                <span className="font-mono text-ink-primary dark:text-ink-primary-dark">
                  ₹1,200
                </span>
              </div>
            </div>
          </Card>
          <Card>
            <SectionTitle title="Tips" />
            <div className="text-xs text-ink-secondary dark:text-ink-secondary-dark space-y-2">
              <div>
                • Slots auto-block during the doctor's lunch and OT hours.
              </div>
              <div>• Patients can self-confirm via WhatsApp link.</div>
              <div>
                • No-shows are tracked and surfaced in the Reception dashboard.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface dark:bg-surface-dark border-t border-line dark:border-line-dark px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 z-20">
        <Link to={isPatient ? "/my/appointments" : "/calendar"} className="hidden sm:block">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap sm:justify-end [&>*]:shrink-0">
          <Link to={isPatient ? "/my/appointments" : "/calendar"} className="sm:hidden">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button variant="secondary">Save draft</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={
              createAppointment.isPending ||
              createPatient.isPending ||
              !doctorId ||
              !departmentId ||
              !selectedSlot ||
              (patientMode === 'existing' ? !selectedPatientId : !newPatient.firstName || !newPatient.lastName || !newPatient.dob)
            }
          >
            <CalendarIcon className="w-4 h-4" />
            {createAppointment.isPending ? 'Booking...' : 'Confirm appointment'}
          </Button>
        </div>
      </div>
    </div>);

}
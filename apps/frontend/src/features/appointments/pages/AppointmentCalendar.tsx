import React from 'react';
import { CalendarDaysIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function AppointmentCalendar() {
  return (
    <div>
      <PageHeader title="Appointments" description="Calendar, slots, and doctor scheduling." breadcrumbs={[{ label: 'Appointments' }]} />
      <ComingSoonState
        icon={CalendarDaysIcon}
        title="Appointments module coming soon"
        description="This module is under development. Appointment booking, calendar views, slot management, and scheduling workflows will be managed here."
      />
    </div>
  );
}

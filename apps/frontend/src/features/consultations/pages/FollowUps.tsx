import React from 'react';
import { CalendarClockIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function FollowUps() {
  return (
    <div>
      <PageHeader title="Follow-ups" description="Scheduled follow-up tasks, reminders, and outreach." breadcrumbs={[{ label: 'OPD' }, { label: 'Follow-ups' }]} />
      <ComingSoonState
        icon={CalendarClockIcon}
        title="Follow-up module coming soon"
        description="This module is under development. Follow-up scheduling, reminders, and outreach tracking will be managed here."
      />
    </div>
  );
}

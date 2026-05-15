import React from 'react';
import { HeartPulseIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function NursingStation() {
  return (
    <div>
      <PageHeader title="Nursing station" description="In-patient nursing workflows, care notes, and medication tracking." breadcrumbs={[{ label: 'Hospital' }, { label: 'Nursing station' }]} />
      <ComingSoonState
        icon={HeartPulseIcon}
        title="Nursing station coming soon"
        description="This module is under development. In-patient nursing workflows, vitals, care notes, and shift handover tools will be managed here."
      />
    </div>
  );
}

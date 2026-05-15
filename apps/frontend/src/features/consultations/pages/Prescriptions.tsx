import React from 'react';
import { FileTextIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function Prescriptions() {
  return (
    <div>
      <PageHeader title="Prescriptions" description="Prescription history, tracking, and communication workflows." breadcrumbs={[{ label: 'OPD' }, { label: 'Prescriptions' }]} />
      <ComingSoonState
        icon={FileTextIcon}
        title="Prescription module coming soon"
        description="This module is under development. Prescription history, status tracking, and patient delivery workflows will be managed here."
      />
    </div>
  );
}

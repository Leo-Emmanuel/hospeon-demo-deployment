import React from 'react';
import { BedDoubleIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function IPD() {
  return (
    <div>
      <PageHeader title="IPD admissions" description="In-patient admissions and hospital stay workflows." breadcrumbs={[{ label: 'Hospital' }, { label: 'IPD admissions' }]} />
      <ComingSoonState
        icon={BedDoubleIcon}
        title="IPD module coming soon"
        description="This module is under development. In-patient admissions, bed allocation, ward tracking, and hospital stay workflows will be managed here."
      />
    </div>
  );
}

export function BedBoard() {
  return (
    <div>
      <PageHeader title="Beds & wards" description="Bed occupancy, ward availability, and allocation tracking." breadcrumbs={[{ label: 'Hospital' }, { label: 'Beds & wards' }]} />
      <ComingSoonState
        icon={BedDoubleIcon}
        title="Bed board coming soon"
        description="This module is under development. Bed occupancy, ward capacity, and allocation workflows will be managed here."
      />
    </div>
  );
}

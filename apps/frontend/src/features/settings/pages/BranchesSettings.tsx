import React from 'react';
import { BuildingIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function BranchesSettings() {
  return (
    <div>
      <PageHeader title="Branches" description="Locations, departments, and branch configuration." breadcrumbs={[{ label: 'Settings' }, { label: 'Branches' }]} />
      <ComingSoonState
        icon={BuildingIcon}
        title="Branch management coming soon"
        description="This module is under development. Branch setup, departments, operating hours, and location-level configuration will be managed here."
      />
    </div>
  );
}

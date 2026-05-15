import React from 'react';
import { BuildingIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function OrganizationSettings() {
  return (
    <div>
      <PageHeader title="Organization" description="Organization-wide branding, compliance, and setup." breadcrumbs={[{ label: 'Settings' }, { label: 'Organization' }]} />
      <ComingSoonState
        icon={BuildingIcon}
        title="Organization settings coming soon"
        description="This module is under development. Organization profile, branding, statutory details, and account-wide setup will be managed here."
      />
    </div>
  );
}

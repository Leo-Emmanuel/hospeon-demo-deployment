import React from 'react';
import { PillIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function PharmacySale() {
  return (
    <div>
      <PageHeader title="Pharmacy sale" description="Dispensing and over-the-counter sales workflows." breadcrumbs={[{ label: 'Pharmacy' }, { label: 'Sales' }, { label: 'New sale' }]} />
      <ComingSoonState
        icon={PillIcon}
        title="Pharmacy module coming soon"
        description="This module is under development. Medicine inventory, dispensing, supplier workflows, and stock controls will be managed here."
      />
    </div>
  );
}

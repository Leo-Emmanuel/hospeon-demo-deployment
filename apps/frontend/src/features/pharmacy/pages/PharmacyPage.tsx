import React from 'react';
import { PillIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function Medicines() {
  return (
    <div>
      <PageHeader title="Medicines" description="Medicine catalog, stock, and pharmacy inventory." breadcrumbs={[{ label: 'Pharmacy' }, { label: 'Medicines' }]} />
      <ComingSoonState
        icon={PillIcon}
        title="Pharmacy module coming soon"
        description="This module is under development. Medicine inventory, dispensing, supplier workflows, and stock controls will be managed here."
      />
    </div>
  );
}

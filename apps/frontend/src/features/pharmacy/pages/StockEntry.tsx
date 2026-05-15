import React from 'react';
import { PillIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function StockEntry() {
  return (
    <div>
      <PageHeader title="Stock entry" description="Supplier receipts and pharmacy stock posting." breadcrumbs={[{ label: 'Pharmacy' }, { label: 'Stock' }, { label: 'New entry' }]} />
      <ComingSoonState
        icon={PillIcon}
        title="Pharmacy module coming soon"
        description="This module is under development. Medicine inventory, dispensing, supplier workflows, and stock controls will be managed here."
      />
    </div>
  );
}

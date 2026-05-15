import React from 'react';
import { PillIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function PurchaseOrders() {
  return (
    <div>
      <PageHeader title="Purchase orders" description="Supplier purchase orders and deliveries." breadcrumbs={[{ label: 'Pharmacy' }, { label: 'Purchase' }]} />
      <ComingSoonState
        icon={PillIcon}
        title="Pharmacy module coming soon"
        description="This module is under development. Medicine inventory, dispensing, supplier workflows, and stock controls will be managed here."
      />
    </div>
  );
}

import React from 'react';
import { ReceiptIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function Payments() {
  return (
    <div>
      <PageHeader title="Payments" description="Payment collections, reconciliations, and settlements." breadcrumbs={[{ label: 'Billing' }, { label: 'Payments' }]} />
      <ComingSoonState
        icon={ReceiptIcon}
        title="Billing module coming soon"
        description="This module is under development. All patient billing, invoice generation, and payment tracking will be managed here."
      />
    </div>
  );
}

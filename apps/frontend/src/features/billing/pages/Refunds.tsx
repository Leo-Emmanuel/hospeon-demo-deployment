import React from 'react';
import { ReceiptIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function Refunds() {
  return (
    <div>
      <PageHeader title="Refunds" description="Refund approvals, reversals, and audit tracking." breadcrumbs={[{ label: 'Billing' }, { label: 'Refunds' }]} />
      <ComingSoonState
        icon={ReceiptIcon}
        title="Billing module coming soon"
        description="This module is under development. All patient billing, invoice generation, and payment tracking will be managed here."
      />
    </div>
  );
}

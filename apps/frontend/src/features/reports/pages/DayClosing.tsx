import React from 'react';
import { ReceiptIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function DayClosing() {
  return (
    <div>
      <PageHeader title="Day closing" description="Cash closure, reconciliations, and operational closeout." breadcrumbs={[{ label: 'Billing' }, { label: 'Day closing' }]} />
      <ComingSoonState
        icon={ReceiptIcon}
        title="Billing module coming soon"
        description="This module is under development. All patient billing, invoice generation, and payment tracking will be managed here."
      />
    </div>
  );
}

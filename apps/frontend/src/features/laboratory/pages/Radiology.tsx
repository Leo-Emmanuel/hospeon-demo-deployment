import React from 'react';
import { ScanLineIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function Radiology() {
  return (
    <div>
      <PageHeader title="Radiology" description="Radiology orders, scheduling, and report workflows." breadcrumbs={[{ label: 'Diagnostics' }, { label: 'Radiology' }]} />
      <ComingSoonState
        icon={ScanLineIcon}
        title="Radiology module coming soon"
        description="This module is under development. Radiology orders, imaging workflows, and report management will be handled here."
      />
    </div>
  );
}

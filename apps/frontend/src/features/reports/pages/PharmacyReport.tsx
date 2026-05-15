import React from 'react';
import { BarChart3Icon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function PharmacyReport() {
  return (
    <div>
      <PageHeader title="Pharmacy report" description="Pharmacy analytics, margins, and stock health." breadcrumbs={[{ label: 'Reports' }, { label: 'Pharmacy' }]} />
      <ComingSoonState
        icon={BarChart3Icon}
        title="Reports module coming soon"
        description="This reporting module is under development. Cross-functional operational and financial reports will be available here."
      />
    </div>
  );
}

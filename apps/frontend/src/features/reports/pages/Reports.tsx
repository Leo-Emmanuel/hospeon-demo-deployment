import React from 'react';
import { BarChart3Icon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function RevenueReport() {
  return (
    <div>
      <PageHeader title="Revenue report" description="Revenue, collections, and finance analytics." breadcrumbs={[{ label: 'Reports' }, { label: 'Revenue' }]} />
      <ComingSoonState
        icon={BarChart3Icon}
        title="Reports module coming soon"
        description="This reporting module is under development. Cross-functional operational and financial reports will be available here."
      />
    </div>
  );
}

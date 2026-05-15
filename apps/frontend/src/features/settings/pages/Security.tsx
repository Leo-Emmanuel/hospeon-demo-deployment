import React from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function Security() {
  return (
    <div>
      <PageHeader title="Security" description="Authentication, session controls, and protection policies." breadcrumbs={[{ label: 'Settings' }, { label: 'Security' }]} />
      <ComingSoonState
        icon={ShieldCheckIcon}
        title="Security module coming soon"
        description="This module is under development. Authentication policies, session controls, audit protections, and security posture settings will be managed here."
      />
    </div>
  );
}

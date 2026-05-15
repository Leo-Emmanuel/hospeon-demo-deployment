import React from 'react';
import { PlugZapIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComingSoonState } from '@/components/ui/ComingSoonState';

export function Integrations() {
  return (
    <div>
      <PageHeader title="Integrations" description="External services, devices, and operational connectors." breadcrumbs={[{ label: 'Settings' }, { label: 'Integrations' }]} />
      <ComingSoonState
        icon={PlugZapIcon}
        title="Integrations module coming soon"
        description="This module is under development. Payment gateways, communication channels, accounting links, and device integrations will be managed here."
      />
    </div>
  );
}

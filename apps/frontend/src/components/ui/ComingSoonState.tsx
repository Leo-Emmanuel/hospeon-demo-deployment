import React from 'react';
import { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';

interface ComingSoonStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoonState({ icon: Icon, title, description }: ComingSoonStateProps) {
  return (
    <Card>
      <div className="mb-4 flex justify-end">
        <StatusBadge tone="warning">Coming soon</StatusBadge>
      </div>
      <EmptyState icon={<Icon />} title={title} description={description} compact={false} />
    </Card>
  );
}

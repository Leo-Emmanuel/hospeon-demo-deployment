import React from 'react';
import { cn } from '@/lib/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-line dark:border-line-dark mb-6', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative',
              isActive
                ? 'text-accent'
                : 'text-ink-tertiary hover:text-ink-secondary'
            )}
          >
            {tab.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{tab.icon}</span>}
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

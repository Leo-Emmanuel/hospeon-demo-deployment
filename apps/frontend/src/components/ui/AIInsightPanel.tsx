import React from 'react';
import {
  SparklesIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircle2Icon,
  ShieldAlertIcon } from
'lucide-react';
import { cn } from '@/lib/cn';
type InsightTone = 'info' | 'warning' | 'success' | 'danger';
type InsightAction = string | {label: string; to?: string;};
interface Insight {
  tone?: InsightTone;
  title?: string;
  body?: string;
  text?: React.ReactNode;
  action?: InsightAction;
}
interface AIInsightPanelProps {
  title?: string;
  subtitle?: string;
  description?: string;
  insights: Insight[];
  variant?: 'panel' | 'inline';
  needsReview?: boolean;
}
const toneIcon: Record<InsightTone, typeof InfoIcon> = {
  info: InfoIcon,
  warning: AlertTriangleIcon,
  success: CheckCircle2Icon,
  danger: ShieldAlertIcon
};
const toneStyle: Record<InsightTone, string> = {
  info: 'text-info bg-info-soft dark:bg-info-soft-dark',
  warning: 'text-warning bg-warning-soft dark:bg-warning-soft-dark',
  success: 'text-success bg-success-soft dark:bg-success-soft-dark',
  danger: 'text-danger bg-danger-soft dark:bg-danger-soft-dark'
};
export function AIInsightPanel({
  title = 'AI Operational Insights',
  subtitle,
  description,
  insights,
  variant = 'panel',
  needsReview
}: AIInsightPanelProps) {
  const resolvedSubtitle = subtitle ?? description;
  return (
    <div
      className={cn(
        'rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark',
        variant === 'panel' && 'p-5'
      )}>
      
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-soft dark:bg-accent-soft-dark text-accent flex items-center justify-center">
            <SparklesIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">
              {title}
            </h3>
            {resolvedSubtitle &&
            <p className="text-xs text-ink-secondary mt-0.5">
                {resolvedSubtitle}
              </p>
            }
          </div>
        </div>
        {needsReview &&
        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-warning-soft text-warning">
            Needs Review
          </span>
        }
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const tone = insight.tone ?? 'info';
          const Icon = toneIcon[tone];
          const content = insight.text ?? insight.body;
          const actionLabel =
          typeof insight.action === 'string' ?
          insight.action :
          insight.action?.label;
          const actionTo =
          typeof insight.action === 'string' ?
          undefined :
          insight.action?.to;
          return (
            <div
              key={i}
              className="flex gap-3 p-3 rounded-xl bg-subtle/60 dark:bg-subtle-dark/60">
              
              <div
                className={cn(
                  'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
                  toneStyle[tone]
                )}>
                
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                {insight.title &&
                <p className="text-xs font-semibold text-ink-primary dark:text-ink-primary-dark">
                    {insight.title}
                  </p>
                }
                {content && (typeof content === 'string' ?
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark mt-0.5 leading-relaxed">
                    {content}
                  </p> :
                <div className="text-xs text-ink-secondary dark:text-ink-secondary-dark mt-0.5 leading-relaxed">
                    {content}
                  </div>
                )}
                {actionLabel && (actionTo ?
                <a
                  href={actionTo}
                  className="mt-2 inline-flex text-xs font-medium text-accent hover:underline">
                    {actionLabel} →
                  </a> :
                <button className="mt-2 text-xs font-medium text-accent hover:underline">
                    {actionLabel} →
                  </button>
                )}
              </div>
            </div>);

        })}
      </div>
      <p className="mt-4 text-[10px] text-ink-tertiary leading-relaxed">
        AI-generated insights based on operational data. Human approval required
        for clinical actions.
      </p>
    </div>);

}
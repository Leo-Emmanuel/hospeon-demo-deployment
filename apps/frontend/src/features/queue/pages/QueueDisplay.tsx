import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState, LoadingSkeleton } from '@/components/ui/EmptyState';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { AutoStatusBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { useDashboardOpdQueue } from '@/features/dashboard/hooks/useDashboardQueries';

export function QueueDisplay() {
  const [now, setNow] = useState(new Date());
  const queueQuery = useDashboardOpdQueue();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const queue = queueQuery.data?.data || [];
  const activeQueue = useMemo(
    () =>
      [...queue]
        .filter((visit) => ['WAITING', 'IN_CONSULTATION'].includes(visit.status))
        .sort((left, right) => left.tokenNumber - right.tokenNumber),
    [queue]
  );

  const nowServing = activeQueue[0];
  const nextInLine = activeQueue.slice(1, 5);
  const otherDoctors = Array.from(
    new Map(
      activeQueue
        .filter((visit) => visit.doctor?.id && visit.id !== nowServing?.id)
        .map((visit) => [visit.doctor!.id, visit])
    ).values()
  ).slice(0, 3);

  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const date = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-ink-primary dark:text-ink-primary-dark flex flex-col">
      <header className="px-4 sm:px-8 lg:px-12 py-5 sm:py-8 border-b border-line dark:border-line-dark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-accent flex items-center justify-center shrink-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-semibold tracking-tight">Hospeon Queue Display</div>
            <div className="text-sm sm:text-base text-ink-tertiary">Live OPD queue updates every 30 seconds</div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <MonoNumber className="text-3xl sm:text-4xl lg:text-5xl font-semibold tabular-nums">{time}</MonoNumber>
          <div className="text-sm sm:text-base text-ink-tertiary mt-1">{date}</div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-8 lg:px-12 py-6 sm:py-10 lg:py-12">
        <section className="flex flex-col">
          <div className="text-xs sm:text-sm uppercase tracking-[0.3em] text-ink-tertiary mb-4 sm:mb-6">Now serving</div>
          <div className="flex-1 rounded-3xl border-2 border-accent bg-accent-soft/40 p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden">
            {queueQuery.isLoading ? (
              <div className="w-full max-w-md">
                <LoadingSkeleton rows={4} />
              </div>
            ) : !nowServing ? (
              <EmptyState compact title="No patients in queue" description="The live OPD queue is currently empty." />
            ) : (
              <>
                <div className="absolute inset-0 bg-accent/5 animate-pulse" />
                <div className="relative text-center">
                  <MonoNumber className="block text-[5rem] sm:text-[7rem] lg:text-[9rem] leading-none font-bold text-accent tabular-nums">
                    T-{String(nowServing.tokenNumber).padStart(4, '0')}
                  </MonoNumber>
                  <div className="text-3xl sm:text-5xl lg:text-6xl font-semibold mt-4 sm:mt-6 tracking-tight">
                    {nowServing.patient.firstName} {nowServing.patient.lastName}
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl text-ink-secondary dark:text-ink-secondary-dark mt-4 sm:mt-6">
                    {nowServing.doctor?.name || 'Doctor assignment pending'}
                  </div>
                  <div className="mt-3 flex justify-center">
                    <AutoStatusBadge status={nowServing.status.toLowerCase()} />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="flex flex-col">
          <div className="text-xs sm:text-sm uppercase tracking-[0.3em] text-ink-tertiary mb-4 sm:mb-6">Next in line</div>
          <div className="flex-1 rounded-3xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-4 sm:p-6 lg:p-8 space-y-2 sm:space-y-3">
            {queueQuery.isLoading ? (
              <LoadingSkeleton rows={5} />
            ) : nextInLine.length === 0 ? (
              <EmptyState compact title="No one waiting next" description="Additional queue entries will appear here automatically." />
            ) : (
              nextInLine.map((visit, index) => (
                <div
                  key={visit.id}
                  className={`flex items-center gap-3 sm:gap-6 px-3 sm:px-6 py-3 sm:py-5 rounded-2xl ${index === 0 ? 'bg-subtle dark:bg-subtle-dark' : ''}`}
                >
                  <MonoNumber className="text-2xl sm:text-3xl lg:text-4xl font-semibold tabular-nums w-24 sm:w-32 lg:w-40 shrink-0">
                    T-{String(visit.tokenNumber).padStart(4, '0')}
                  </MonoNumber>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight truncate">
                      {visit.patient.firstName} {visit.patient.lastName}
                    </div>
                    <div className="text-sm sm:text-base text-ink-tertiary mt-0.5 sm:mt-1 truncate">
                      {visit.doctor?.name || 'Doctor assignment pending'}
                    </div>
                  </div>
                  {index === 0 ? (
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-accent font-semibold shrink-0">Up next</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <section className="px-4 sm:px-8 lg:px-12 py-5 sm:py-6 border-t border-line dark:border-line-dark">
        <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-ink-tertiary mb-3">Other doctors</div>
        {queueQuery.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : otherDoctors.length === 0 ? (
          <EmptyState compact title="No parallel queues" description="Doctor-wise queue summaries will appear when more than one doctor is active." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            {otherDoctors.map((visit) => (
              <div key={visit.id} className="flex items-center gap-3 sm:gap-4">
                <MonoNumber className="text-xl sm:text-2xl font-semibold tabular-nums shrink-0">
                  T-{String(visit.tokenNumber).padStart(4, '0')}
                </MonoNumber>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-medium truncate">{visit.doctor?.name || 'Doctor assignment pending'}</div>
                  <div className="text-xs sm:text-sm text-ink-tertiary truncate">
                    {visit.patient.firstName} {visit.patient.lastName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-ink-primary dark:bg-surface-dark text-white dark:text-ink-primary-dark px-4 sm:px-8 lg:px-12 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm sm:text-base">
          Please listen for your token. Current live queue size:{' '}
          <MonoNumber className="font-semibold">{activeQueue.length}</MonoNumber>.
        </div>
        <div className="text-xs sm:text-sm opacity-70">
          Statuses update automatically from the clinic dashboard.
        </div>
      </footer>
    </div>
  );
}

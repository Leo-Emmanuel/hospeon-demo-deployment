import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useCurrentUser } from '@/features/auth/hooks/useAuthQueries';
import { LoadingSkeleton } from '@/components/ui/EmptyState';
import { ToastProvider } from '@/components/ui/Toast';

function App() {
  const { isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-canvas-dark">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-5 lg:flex lg:flex-col">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-subtle dark:bg-subtle-dark animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-subtle dark:bg-subtle-dark animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-subtle dark:bg-subtle-dark animate-pulse" />
              </div>
            </div>
            <LoadingSkeleton rows={8} className="space-y-2" />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="h-14 border-b border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 lg:px-6">
              <div className="flex h-full items-center justify-between gap-4">
                <div className="h-9 w-56 rounded-xl bg-subtle dark:bg-subtle-dark animate-pulse" />
                <div className="flex items-center gap-3">
                  <div className="h-9 w-24 rounded-xl bg-subtle dark:bg-subtle-dark animate-pulse" />
                  <div className="h-9 w-9 rounded-full bg-subtle dark:bg-subtle-dark animate-pulse" />
                </div>
              </div>
            </header>

            <main className="flex-1 px-4 py-4 lg:px-6">
              <div className="mx-auto max-w-[1600px] space-y-6">
                <div className="space-y-2">
                  <div className="h-8 w-48 rounded-xl bg-subtle dark:bg-subtle-dark animate-pulse" />
                  <div className="h-4 w-80 rounded bg-subtle dark:bg-subtle-dark animate-pulse" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-3xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-5 shadow-soft">
                      <div className="mb-4 h-3 w-24 rounded bg-subtle dark:bg-subtle-dark animate-pulse" />
                      <div className="h-8 w-20 rounded bg-subtle dark:bg-subtle-dark animate-pulse" />
                      <div className="mt-5 h-12 rounded-2xl bg-subtle dark:bg-subtle-dark animate-pulse" />
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-5 shadow-soft">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="h-5 w-40 rounded bg-subtle dark:bg-subtle-dark animate-pulse" />
                    <div className="h-9 w-44 rounded-xl bg-subtle dark:bg-subtle-dark animate-pulse" />
                  </div>
                  <LoadingSkeleton rows={7} />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

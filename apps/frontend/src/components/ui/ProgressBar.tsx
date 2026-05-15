import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';

type ProgressState = 'idle' | 'loading' | 'completing';

export function ProgressBar() {
  const location = useLocation();
  const [state, setState] = useState<ProgressState>('idle');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const previousLocationRef = useRef(`${location.pathname}${location.search}${location.hash}`);
  const pendingNavigationRef = useRef(false);

  useEffect(() => {
    const startProgress = () => {
      pendingNavigationRef.current = true;
      setState('loading');
      setProgress(10);
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function pushState(...args) {
      startProgress();
      return originalPushState(...args);
    };

    window.history.replaceState = function replaceState(...args) {
      startProgress();
      return originalReplaceState(...args);
    };

    const handlePopState = () => startProgress();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (state !== 'loading') {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 80) {
          return current;
        }

        const next = current + Math.max(2, (80 - current) * 0.12);
        return Math.min(next, 80);
      });
    }, 120);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state]);

  useEffect(() => {
    const currentLocation = `${location.pathname}${location.search}${location.hash}`;

    if (currentLocation === previousLocationRef.current) {
      return;
    }

    previousLocationRef.current = currentLocation;

    if (!pendingNavigationRef.current) {
      setState('loading');
      setProgress(25);
    }

    pendingNavigationRef.current = false;
    setState('completing');
    setProgress(100);

    const handle = window.setTimeout(() => {
      setState('idle');
      setProgress(0);
    }, 220);

    return () => window.clearTimeout(handle);
  }, [location]);

  return (
    <div
      className={cn(
        'pointer-events-none fixed left-0 top-0 z-[100] h-[3px] w-full transition-opacity duration-200',
        state === 'idle' ? 'opacity-0' : 'opacity-100'
      )}>
      <div
        className={cn(
          'h-full origin-left rounded-r-full bg-accent shadow-[0_0_12px_rgba(63,142,132,0.55)] transition-[width,opacity] duration-200 ease-out',
          state === 'completing' ? 'opacity-0' : 'opacity-100'
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

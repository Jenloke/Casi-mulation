import { ANALYTICS_PATH, type AnalyticsSnapshotDto } from '@casino/contracts';
import { useEffect, useState } from 'react';

const POLL_MS = 1_000;

/** Polls the server's analytics snapshot. On failure it keeps the last good snapshot. */
export function useAnalytics(): { snapshot: AnalyticsSnapshotDto | null; error: string | null } {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshotDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(ANALYTICS_PATH, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setSnapshot((await response.json()) as AnalyticsSnapshotDto);
        setError(null);
      } catch (caught) {
        if (!controller.signal.aborted) setError(String(caught));
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  return { snapshot, error };
}

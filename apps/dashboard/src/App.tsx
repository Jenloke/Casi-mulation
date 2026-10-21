import type { AnalyticsSnapshotDto } from '@casino/contracts';
import { Badge } from '@casino/ui/components/badge';
import { Skeleton } from '@casino/ui/components/skeleton';
import { ModeToggle } from '@casino/ui/theme/ModeToggle';
import { CircleAlertIcon, LoaderCircleIcon } from 'lucide-react';
import { useAnalytics } from './api/useAnalytics.ts';
import { ItemEffectChart } from './charts/ItemEffectChart.tsx';
import { ItemUsageChart } from './charts/ItemUsageChart.tsx';
import { PopulationChart } from './charts/PopulationChart.tsx';
import { RoundsTimeline } from './charts/RoundsTimeline.tsx';
import { RtpChart } from './charts/RtpChart.tsx';
import { WageredPaidChart } from './charts/WageredPaidChart.tsx';
import { KpiRow } from './components/KpiRow.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { formatClock } from './format.ts';
import { gameSeries } from './theme.ts';

const KPI_PLACEHOLDERS = ['rounds', 'wagered', 'rtp', 'guests', 'bots'];

export function App() {
  const { snapshot, error } = useAnalytics();
  const series = snapshot ? gameSeries(snapshot.games) : [];

  return (
    <main className="min-h-svh px-[clamp(1rem,3vw,2.5rem)] pt-6 pb-10">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Casino analytics</h1>
          <p className="text-muted-foreground">
            Every bet, payout and item use on the floor, aggregated live
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LiveStatus snapshot={snapshot} error={error} />
          <ModeToggle />
        </div>
      </header>
      {snapshot ? (
        <>
          <KpiRow snapshot={snapshot} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-4">
            <RoundsTimeline timeline={snapshot.timeline} series={series} />
            <WageredPaidChart games={snapshot.games} series={series} />
            <RtpChart games={snapshot.games} series={series} />
            <PopulationChart population={snapshot.population} />
            <ItemUsageChart usage={snapshot.itemUsage} series={series} />
            <ItemEffectChart effects={snapshot.itemEffect} series={series} />
            <Leaderboard entries={snapshot.leaderboard} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4" aria-hidden="true">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            {KPI_PLACEHOLDERS.map((key) => (
              <Skeleton key={key} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      )}
    </main>
  );
}

function LiveStatus(props: { snapshot: AnalyticsSnapshotDto | null; error: string | null }) {
  if (props.error) {
    return (
      <Badge variant="destructive">
        <CircleAlertIcon />
        Server unreachable, showing the last update
      </Badge>
    );
  }
  if (!props.snapshot) {
    return (
      <Badge variant="secondary">
        <LoaderCircleIcon className="animate-spin" />
        Connecting to the casino floor…
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="tabular-nums">
      <span className="size-1.5 rounded-full bg-success" />
      Live · updated {formatClock(props.snapshot.generatedAt)}
    </Badge>
  );
}

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

export function App() {
  const { snapshot, error } = useAnalytics();
  const status = error
    ? 'Server unreachable, showing the last update'
    : snapshot
      ? `Live · updated ${formatClock(snapshot.generatedAt)}`
      : 'Connecting to the casino floor…';
  const series = snapshot ? gameSeries(snapshot.games) : [];

  return (
    <main className="dashboard">
      <header className="page-header">
        <div>
          <h1>Casino analytics</h1>
          <p className="subtitle">Every bet, payout and item use on the floor, aggregated live</p>
        </div>
        <p className={error ? 'live stale' : 'live'}>{status}</p>
      </header>
      {snapshot && (
        <>
          <KpiRow snapshot={snapshot} />
          <div className="card-grid">
            <RoundsTimeline timeline={snapshot.timeline} series={series} />
            <WageredPaidChart games={snapshot.games} series={series} />
            <RtpChart games={snapshot.games} series={series} />
            <PopulationChart population={snapshot.population} />
            <ItemUsageChart usage={snapshot.itemUsage} series={series} />
            <ItemEffectChart effects={snapshot.itemEffect} series={series} />
            <Leaderboard entries={snapshot.leaderboard} />
          </div>
        </>
      )}
    </main>
  );
}

import type { AnalyticsSnapshotDto } from '@casino/contracts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@casino/ui/components/card';
import { formatCompact, formatCount, formatPercent } from '../format.ts';

interface StatTileProps {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly testId: string;
}

function StatTile({ label, value, detail, testId }: StatTileProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold" data-testid={testId}>
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}

export function KpiRow({ snapshot }: { snapshot: AnalyticsSnapshotDto }) {
  const { totals, population } = snapshot;
  const houseKept = totals.wagered - totals.paid;
  return (
    <section
      className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3"
      aria-label="Headline numbers"
    >
      <StatTile
        label="Rounds played"
        value={formatCount(totals.rounds)}
        detail="settled since start"
        testId="total-rounds"
      />
      <StatTile
        label="Chips wagered"
        value={formatCompact(totals.wagered)}
        detail={`${formatCompact(totals.paid)} paid back`}
        testId="total-wagered"
      />
      <StatTile
        label="Actual RTP"
        value={formatPercent(totals.actualRtp)}
        detail={`house kept ${formatCompact(houseKept)} chips`}
        testId="total-rtp"
      />
      <StatTile
        label="Guests online"
        value={formatCount(population.humansOnline)}
        detail="real players"
        testId="humans-online"
      />
      <StatTile
        label="Bots online"
        value={formatCount(population.botsOnline)}
        detail="AI players"
        testId="bots-online"
      />
    </section>
  );
}

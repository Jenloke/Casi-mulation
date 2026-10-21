import type { RoundOutcome, RoundViewDto } from '@casino/contracts';
import { Button } from '@casino/ui/components/button';
import { cn } from '@casino/ui/lib/utils';
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

interface RoundCardProps {
  readonly round: RoundViewDto;
  readonly disabled: boolean;
  readonly onAction: (action: string) => void;
}

/** Left edge in the outcome's color; the result line carries an icon too, never color alone. */
const OUTCOME_EDGE: Readonly<Record<RoundOutcome | 'pending', string>> = {
  win: 'border-success',
  loss: 'border-destructive',
  push: 'border-muted-foreground',
  pending: 'border-primary',
};

export function RoundCard({ round, disabled, onAction }: RoundCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border-l-4 bg-muted/50 px-3 py-2.5',
        OUTCOME_EDGE[round.outcome ?? 'pending'],
      )}
      data-testid="round-card"
    >
      <p className="font-medium" data-testid="round-headline">
        {round.headline}
      </p>
      <ul className="mt-1 list-disc pl-5 text-muted-foreground">
        {round.details.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {round.status === 'settled' ? (
        <p
          className={cn('mt-2 flex items-center gap-1.5 font-medium', resultColor(round))}
          data-testid="round-result"
        >
          <ResultIcon round={round} />
          {describeResult(round)}
        </p>
      ) : (
        <div className="mt-2 flex gap-1.5">
          {round.actions.map((action) => (
            <Button
              key={action}
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => onAction(action)}
            >
              {action[0]?.toUpperCase()}
              {action.slice(1)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultIcon({ round }: { round: RoundViewDto }) {
  if (round.outcome === 'win') return <TrendingUpIcon className="size-4" />;
  if (round.outcome === 'push') return <MinusIcon className="size-4" />;
  return <TrendingDownIcon className="size-4" />;
}

function resultColor(round: RoundViewDto): string {
  if (round.outcome === 'win') return 'text-success';
  if (round.outcome === 'push') return 'text-muted-foreground';
  return 'text-destructive';
}

function describeResult(round: RoundViewDto): string {
  if (round.outcome === 'win') return `Won ${round.payout - round.wager} chips`;
  if (round.outcome === 'push') return 'Push: stake returned';
  return `Lost ${round.wager} chips`;
}

import type { RoundViewDto } from '@casino/contracts';

interface RoundCardProps {
  readonly round: RoundViewDto;
  readonly disabled: boolean;
  readonly onAction: (action: string) => void;
}

export function RoundCard({ round, disabled, onAction }: RoundCardProps) {
  return (
    <div className={`round-card ${round.outcome ?? 'pending'}`} data-testid="round-card">
      <p className="headline" data-testid="round-headline">
        {round.headline}
      </p>
      <ul>
        {round.details.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {round.status === 'settled' ? (
        <p className="result" data-testid="round-result">
          {describeResult(round)}
        </p>
      ) : (
        <div className="button-row">
          {round.actions.map((action) => (
            <button key={action} type="button" disabled={disabled} onClick={() => onAction(action)}>
              {action[0]?.toUpperCase()}
              {action.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function describeResult(round: RoundViewDto): string {
  if (round.outcome === 'win') return `Won ${round.payout - round.wager} chips`;
  if (round.outcome === 'push') return 'Push: stake returned';
  return `Lost ${round.wager} chips`;
}

import { BetForm } from './BetForm.tsx';
import { percent } from './format.ts';
import { useClientState, useSendCommand } from './GameContext.tsx';
import { RoundCard } from './RoundCard.tsx';

/** The table you sit at: bet form, the current round, and the item in play. */
export function TablePanel() {
  const { welcome, state } = useClientState();
  const send = useSendCommand();
  const self = state?.self;
  const game = welcome?.games.find((candidate) => candidate.id === self?.table?.gameId);
  if (!welcome || !self || !game) return null;

  const round = self.round?.gameId === game.id ? self.round : null;
  const busy = round?.status === 'pending' || self.autoPlay;
  const activeItem = self.inventory.find((item) => item.gameId === game.id && item.active);
  const activeItemName = welcome.items.find((item) => item.id === activeItem?.itemId)?.name;
  return (
    <section className="panel" data-testid="table-panel">
      <h2>{game.name} table</h2>
      <p className="muted">
        Bets {game.minBet}–{game.maxBet} · theoretical RTP {percent(game.theoreticalRtp)}
      </p>
      <BetForm
        key={game.id}
        game={game}
        disabled={busy}
        onBet={(amount, option) => send({ type: 'placeBet', amount, option })}
      />
      {activeItem && (
        <p className="item-note">
          {activeItemName} active · {activeItem.usesLeft} uses left
        </p>
      )}
      {round && (
        <RoundCard
          round={round}
          disabled={self.autoPlay}
          onAction={(action) => send({ type: 'roundAction', action })}
        />
      )}
      <button type="button" disabled={busy} onClick={() => send({ type: 'leaveSeat' })}>
        Leave table
      </button>
    </section>
  );
}

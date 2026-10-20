import { formatChips } from './format.ts';
import { useClientState } from './GameContext.tsx';

export function TopBar() {
  const { status, state } = useClientState();
  const self = state?.self;
  const me = state?.world.players.find((player) => player.id === self?.playerId);
  return (
    <header className="topbar">
      <strong className="brand">Casi-mulation</strong>
      <span data-testid="player-name">{me?.name ?? '…'}</span>
      <span className="chips">
        <span data-testid="chip-count">{formatChips(self?.chips ?? 0)}</span> chips
      </span>
      <span className="muted">
        tile <span data-testid="player-pos">{self ? `${self.pos.x},${self.pos.y}` : '-'}</span>
      </span>
      <span className="muted" data-testid="sim-speed">
        {state?.world.simSpeed ?? 1}x
      </span>
      <span className={`status ${status}`} data-testid="connection-status">
        {status}
      </span>
    </header>
  );
}

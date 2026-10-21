import { Badge } from '@casino/ui/components/badge';
import { cn } from '@casino/ui/lib/utils';
import { CoinsIcon } from 'lucide-react';
import type { ConnectionStatus } from '../bus/gameBus.ts';
import { formatChips } from './format.ts';
import { useClientState } from './GameContext.tsx';

const STATUS_DOT: Readonly<Record<ConnectionStatus, string>> = {
  connecting: 'animate-pulse bg-primary',
  online: 'bg-success',
  offline: 'bg-destructive',
};

export function TopBar() {
  const { status, state } = useClientState();
  const self = state?.self;
  const me = state?.world.players.find((player) => player.id === self?.playerId);
  return (
    <header className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-card/90 px-3.5 py-2 text-sm text-card-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm">
      <strong className="font-heading font-semibold tracking-wide text-primary">
        Casi-mulation
      </strong>
      <span data-testid="player-name">{me?.name ?? '…'}</span>
      <span className="flex items-center gap-1.5 font-semibold tabular-nums">
        <CoinsIcon className="size-4 text-primary" />
        <span data-testid="chip-count">{formatChips(self?.chips ?? 0)}</span> chips
      </span>
      <span className="text-muted-foreground">
        tile{' '}
        <span className="tabular-nums" data-testid="player-pos">
          {self ? `${self.pos.x},${self.pos.y}` : '-'}
        </span>
      </span>
      <Badge variant="secondary" className="tabular-nums" data-testid="sim-speed">
        {state?.world.simSpeed ?? 1}x
      </Badge>
      <Badge variant="outline" className="ml-auto capitalize" data-testid="connection-status">
        <span className={cn('size-1.5 rounded-full', STATUS_DOT[status])} />
        {status}
      </Badge>
    </header>
  );
}

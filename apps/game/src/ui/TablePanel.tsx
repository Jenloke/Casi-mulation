import { Button } from '@casino/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@casino/ui/components/card';
import { SparklesIcon } from 'lucide-react';
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
    <Card size="sm" data-testid="table-panel">
      <CardHeader>
        <CardTitle>
          <h2>{game.name} table</h2>
        </CardTitle>
        <CardDescription>
          Bets {game.minBet}–{game.maxBet} · theoretical RTP {percent(game.theoreticalRtp)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <BetForm
          key={game.id}
          game={game}
          disabled={busy}
          onBet={(amount, option) => send({ type: 'placeBet', amount, option })}
        />
        {activeItem && (
          <p className="flex items-center gap-1.5 text-success">
            <SparklesIcon className="size-4" />
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
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={busy}
          onClick={() => send({ type: 'leaveSeat' })}
        >
          Leave table
        </Button>
      </CardFooter>
    </Card>
  );
}

import { Button } from '@casino/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@casino/ui/components/card';
import { firstTileOfKind, roomiestTable } from './floorQueries.ts';
import { useClientState, useSendCommand } from './GameContext.tsx';

/** Quick travel: the same moveTo command a click on the floor sends. */
export function Destinations() {
  const { welcome, state } = useClientState();
  const send = useSendCommand();
  if (!welcome || !state || state.self.autoPlay) return null;
  const counter = firstTileOfKind(welcome.floor, 'counter');
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <h2>Walk to</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {counter && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => send({ type: 'moveTo', target: counter })}
          >
            Shop
          </Button>
        )}
        {welcome.games.map((game) => (
          <Button
            key={game.id}
            variant="secondary"
            size="sm"
            onClick={() => {
              const table = roomiestTable(welcome.floor, game.id, state.world.players);
              const target = table?.tiles[0];
              if (target) send({ type: 'moveTo', target });
            }}
          >
            {game.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

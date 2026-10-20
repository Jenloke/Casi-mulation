import { firstTileOfKind, roomiestTable } from './floorQueries.ts';
import { useClientState, useSendCommand } from './GameContext.tsx';

/** Quick travel: the same moveTo command a click on the floor sends. */
export function Destinations() {
  const { welcome, state } = useClientState();
  const send = useSendCommand();
  if (!welcome || !state || state.self.autoPlay) return null;
  const counter = firstTileOfKind(welcome.floor, 'counter');
  return (
    <section className="panel">
      <h2>Walk to</h2>
      <div className="button-row">
        {counter && (
          <button type="button" onClick={() => send({ type: 'moveTo', target: counter })}>
            Shop
          </button>
        )}
        {welcome.games.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => {
              const table = roomiestTable(welcome.floor, game.id, state.world.players);
              const target = table?.tiles[0];
              if (target) send({ type: 'moveTo', target });
            }}
          >
            {game.name}
          </button>
        ))}
      </div>
    </section>
  );
}

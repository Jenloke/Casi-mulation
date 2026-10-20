import { useClientState, useSendCommand } from './GameContext.tsx';

export function InventoryPanel() {
  const { welcome, state } = useClientState();
  const send = useSendCommand();
  const self = state?.self;
  if (!welcome || !self) return null;
  return (
    <section className="panel" data-testid="inventory-panel">
      <h2>Inventory</h2>
      {self.inventory.length === 0 ? (
        <p className="muted">Empty. Lucky items are sold at the shop counter.</p>
      ) : (
        <ul className="item-list">
          {self.inventory.map((owned) => {
            const item = welcome.items.find((candidate) => candidate.id === owned.itemId);
            const game = welcome.games.find((candidate) => candidate.id === owned.gameId);
            return (
              <li key={owned.instanceId}>
                <div>
                  <strong>{item?.name ?? owned.itemId}</strong>{' '}
                  <span className="muted">
                    {game?.name} · {owned.usesLeft} uses left
                  </span>
                </div>
                <button
                  type="button"
                  aria-pressed={owned.active}
                  disabled={self.autoPlay}
                  onClick={() => send({ type: 'toggleItem', instanceId: owned.instanceId })}
                >
                  {owned.active ? 'Active' : 'Use'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

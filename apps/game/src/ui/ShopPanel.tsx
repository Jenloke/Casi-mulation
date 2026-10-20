import { percent } from './format.ts';
import { useClientState, useSendCommand } from './GameContext.tsx';

export function ShopPanel() {
  const { welcome, state } = useClientState();
  const send = useSendCommand();
  const self = state?.self;
  if (!welcome || !self?.atShop) return null;
  const gameName = (gameId: string) => welcome.games.find((game) => game.id === gameId)?.name;
  return (
    <section className="panel" data-testid="shop-panel">
      <h2>Shop</h2>
      <ul className="item-list">
        {welcome.items.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.name}</strong>{' '}
              <span className="muted">
                {gameName(item.gameId)} · +{percent(item.boost, 0)} luck · {item.uses} uses
              </span>
              <p className="muted">{item.description}</p>
            </div>
            <button
              type="button"
              disabled={self.autoPlay || self.chips < item.price}
              onClick={() => send({ type: 'buyItem', itemId: item.id })}
            >
              Buy {item.name} · {item.price}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

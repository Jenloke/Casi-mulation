import type { GameBus } from '../bus/gameBus.ts';
import type { ClientStateStore } from '../state/ClientStateStore.ts';
import { AutoPlayPanel } from './AutoPlayPanel.tsx';
import { Destinations } from './Destinations.tsx';
import { GameProvider } from './GameContext.tsx';
import { InventoryPanel } from './InventoryPanel.tsx';
import { Notices } from './Notices.tsx';
import { PhaserHost } from './PhaserHost.tsx';
import { ShopPanel } from './ShopPanel.tsx';
import { TablePanel } from './TablePanel.tsx';
import { TopBar } from './TopBar.tsx';

export function App(props: { bus: GameBus; store: ClientStateStore }) {
  return (
    <GameProvider bus={props.bus} store={props.store}>
      <div className="layout">
        <main className="stage">
          <PhaserHost />
          <TopBar />
          <Notices />
        </main>
        <aside className="sidebar">
          <AutoPlayPanel />
          <Destinations />
          <TablePanel />
          <ShopPanel />
          <InventoryPanel />
          <p className="hint">
            Arrow keys or click to walk. Click a table to take a seat, or the gold counter to shop.
          </p>
        </aside>
      </div>
    </GameProvider>
  );
}

import { Kbd, KbdGroup } from '@casino/ui/components/kbd';
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
      <div className="grid grid-rows-[60vh_auto] md:h-full md:grid-cols-[minmax(0,1fr)_340px] md:grid-rows-1">
        <main className="relative min-w-0 overflow-hidden">
          <PhaserHost />
          <TopBar />
          <Notices />
        </main>
        <aside className="flex flex-col gap-3 overflow-y-auto border-t border-sidebar-border bg-sidebar p-3 text-sidebar-foreground *:shrink-0 md:border-t-0 md:border-l">
          <AutoPlayPanel />
          <Destinations />
          <TablePanel />
          <ShopPanel />
          <InventoryPanel />
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            <KbdGroup>
              <Kbd>←</Kbd>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <Kbd>→</Kbd>
            </KbdGroup>{' '}
            or click to walk. Click a table to take a seat, or the gold counter to shop.
          </p>
        </aside>
      </div>
    </GameProvider>
  );
}

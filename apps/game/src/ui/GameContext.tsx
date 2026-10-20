import type { PlayerCommand } from '@casino/contracts';
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { GameBus } from '../bus/gameBus.ts';
import type { ClientState, ClientStateStore } from '../state/ClientStateStore.ts';

interface GameContextValue {
  readonly bus: GameBus;
  readonly store: ClientStateStore;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider(props: {
  bus: GameBus;
  store: ClientStateStore;
  children: ReactNode;
}) {
  const { bus, store, children } = props;
  const value = useMemo(() => ({ bus, store }), [bus, store]);
  return <GameContext value={value}>{children}</GameContext>;
}

function useGame(): GameContextValue {
  const value = use(GameContext);
  if (!value) throw new Error('GameProvider is missing');
  return value;
}

export function useClientState(): ClientState {
  const { store } = useGame();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/** Components never change game state themselves; they put commands on the bus. */
export function useSendCommand(): (command: PlayerCommand) => void {
  const { bus } = useGame();
  return useCallback((command: PlayerCommand) => bus.emit('command', command), [bus]);
}

export function useBus(): GameBus {
  return useGame().bus;
}

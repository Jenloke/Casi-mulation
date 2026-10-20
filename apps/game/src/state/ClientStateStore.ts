import type { StateMessage, WelcomeMessage } from '@casino/contracts';
import type { ConnectionStatus, GameBus } from '../bus/gameBus.ts';

export interface Notice {
  readonly id: number;
  readonly text: string;
}

export interface ClientState {
  readonly status: ConnectionStatus;
  readonly welcome: WelcomeMessage | null;
  readonly state: StateMessage | null;
  readonly notices: readonly Notice[];
}

const NOTICE_MS = 3_000;
const MAX_NOTICES = 3;

/** React's view of the game, fed only by bus events; read it with useSyncExternalStore. */
export class ClientStateStore {
  private current: ClientState = { status: 'connecting', welcome: null, state: null, notices: [] };
  private readonly listeners = new Set<() => void>();
  private nextNoticeId = 1;

  constructor(bus: GameBus) {
    bus.on('net:status', (status) => this.update({ status }), { replay: true });
    bus.on('net:welcome', (welcome) => this.update({ welcome }), { replay: true });
    bus.on('net:state', (state) => this.update({ state }), { replay: true });
    bus.on('net:rejected', (message) => {
      // Bumping into walls with the arrow keys is not worth a notice.
      if (message.command !== 'step') this.notify(message.reason);
    });
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): ClientState => this.current;

  private notify(text: string): void {
    const notice = { id: this.nextNoticeId++, text };
    this.update({ notices: [...this.current.notices, notice].slice(-MAX_NOTICES) });
    window.setTimeout(() => {
      this.update({ notices: this.current.notices.filter((other) => other.id !== notice.id) });
    }, NOTICE_MS);
  }

  private update(patch: Partial<ClientState>): void {
    this.current = { ...this.current, ...patch };
    for (const listener of this.listeners) listener();
  }
}

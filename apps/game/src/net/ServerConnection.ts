import type { ClientMessage, ServerMessage } from '@casino/contracts';
import type { GameBus } from '../bus/gameBus.ts';

const RECONNECT_DELAY_MS = 1_000;

/** Bridges the WebSocket and the bus: server messages in, commands out, reconnecting on drop. */
export class ServerConnection {
  private readonly bus: GameBus;
  private readonly url: string;
  private socket: WebSocket | null = null;

  constructor(bus: GameBus, url: string) {
    this.bus = bus;
    this.url = url;
  }

  open(): void {
    this.bus.on('command', (command) => this.send({ type: 'command', command }));
    this.connect();
  }

  private connect(): void {
    this.bus.emit('net:status', 'connecting');
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.addEventListener('open', () => this.bus.emit('net:status', 'online'));
    socket.addEventListener('message', (event) => this.dispatch(String(event.data)));
    socket.addEventListener('close', () => {
      this.bus.emit('net:status', 'offline');
      window.setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
    });
  }

  private dispatch(raw: string): void {
    const message = JSON.parse(raw) as ServerMessage;
    if (message.type === 'welcome') this.bus.emit('net:welcome', message);
    else if (message.type === 'state') this.bus.emit('net:state', message);
    else this.bus.emit('net:rejected', message);
  }

  private send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }
}

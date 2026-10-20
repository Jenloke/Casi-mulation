import type { PlayerId, ServerMessage } from '@casino/contracts';
import type { CasinoWorld } from '@casino/core';
import { parseClientMessage } from './messageCodec.ts';

/** The part of a WebSocket the hub needs, so it can be tested without a network. */
export interface ClientSocket {
  send(data: string): void;
}

/** Connected game clients, one guest per socket: relays commands in and state out. */
export class ClientHub {
  private readonly world: CasinoWorld;
  private readonly sockets = new Map<PlayerId, ClientSocket>();

  constructor(world: CasinoWorld) {
    this.world = world;
  }

  get size(): number {
    return this.sockets.size;
  }

  connect(socket: ClientSocket): PlayerId {
    const { id } = this.world.join();
    this.sockets.set(id, socket);
    this.send(socket, {
      type: 'welcome',
      playerId: id,
      floor: this.world.floorDto(),
      games: this.world.gameInfos(),
      items: this.world.itemInfos(),
    });
    return id;
  }

  receive(playerId: PlayerId, raw: string): void {
    const message = parseClientMessage(raw);
    const socket = this.sockets.get(playerId);
    if (!message || !socket) return;
    const result = this.world.execute(playerId, message.command);
    if (!result.ok) {
      this.send(socket, { type: 'rejected', command: message.command.type, reason: result.reason });
    }
  }

  disconnect(playerId: PlayerId): void {
    this.sockets.delete(playerId);
    this.world.leave(playerId);
  }

  /** Sends every client the shared world snapshot (serialised once) plus its private state. */
  broadcastState(): void {
    if (this.sockets.size === 0) return;
    const world = JSON.stringify(this.world.snapshot());
    for (const [playerId, socket] of this.sockets) {
      const self = this.world.selfState(playerId);
      if (self) socket.send(`{"type":"state","world":${world},"self":${JSON.stringify(self)}}`);
    }
  }

  private send(socket: ClientSocket, message: ServerMessage): void {
    socket.send(JSON.stringify(message));
  }
}

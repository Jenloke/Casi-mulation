import type {
  PlayerCommand,
  RejectedMessage,
  StateMessage,
  WelcomeMessage,
} from '@casino/contracts';
import { TypedEventBus } from './TypedEventBus.ts';

export type ConnectionStatus = 'connecting' | 'online' | 'offline';

/**
 * Everything React, Phaser and the network say to each other. They share nothing else:
 * `net:*` events flow from the server connection, `command` events flow to it.
 */
export interface GameEvents {
  'net:status': ConnectionStatus;
  'net:welcome': WelcomeMessage;
  'net:state': StateMessage;
  'net:rejected': RejectedMessage;
  command: PlayerCommand;
}

export type GameBus = TypedEventBus<GameEvents>;

export function createGameBus(): GameBus {
  return new TypedEventBus<GameEvents>();
}

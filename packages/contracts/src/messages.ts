import type { PlayerCommand, PlayerCommandType } from './commands.ts';
import type { PlayerId } from './ids.ts';
import type {
  FloorDto,
  GameInfoDto,
  ItemDefinitionDto,
  SelfStateDto,
  WorldSnapshotDto,
} from './world.ts';

/** WebSocket path the game client connects to. */
export const GAME_SOCKET_PATH = '/ws';

export interface CommandMessage {
  readonly type: 'command';
  readonly command: PlayerCommand;
}

/** Client -> server. */
export type ClientMessage = CommandMessage;

export interface WelcomeMessage {
  readonly type: 'welcome';
  readonly playerId: PlayerId;
  readonly floor: FloorDto;
  readonly games: readonly GameInfoDto[];
  readonly items: readonly ItemDefinitionDto[];
}

export interface StateMessage {
  readonly type: 'state';
  readonly world: WorldSnapshotDto;
  readonly self: SelfStateDto;
}

export interface RejectedMessage {
  readonly type: 'rejected';
  readonly command: PlayerCommandType;
  readonly reason: string;
}

/** Server -> client. */
export type ServerMessage = WelcomeMessage | StateMessage | RejectedMessage;

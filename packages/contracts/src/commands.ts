import type { Direction, GridPos } from './grid.ts';
import type { SimSpeed } from './ids.ts';

/**
 * Everything a player can ask the world to do. Human clients send these over the
 * WebSocket; the AI brain issues exactly the same commands.
 */
export type PlayerCommand =
  | { readonly type: 'moveTo'; readonly target: GridPos }
  | { readonly type: 'step'; readonly direction: Direction }
  | { readonly type: 'leaveSeat' }
  | { readonly type: 'placeBet'; readonly amount: number; readonly option: string }
  | { readonly type: 'roundAction'; readonly action: string }
  | { readonly type: 'buyItem'; readonly itemId: string }
  | { readonly type: 'toggleItem'; readonly instanceId: string }
  | { readonly type: 'setAutoPlay'; readonly enabled: boolean }
  | { readonly type: 'setSimSpeed'; readonly speed: SimSpeed };

export type PlayerCommandType = PlayerCommand['type'];

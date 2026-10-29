import type { GridPos } from './grid.ts';
import type { GameId, PlayerId, PlayerKind, SimSpeed } from './ids.ts';

export type TileKind = 'wall' | 'floor' | 'table' | 'seat' | 'counter' | 'shop' | 'entrance';

export interface SeatDto {
  readonly id: string;
  readonly pos: GridPos;
}

export interface TableDto {
  readonly id: string;
  readonly gameId: GameId;
  readonly label: string;
  readonly tiles: readonly GridPos[];
  readonly seats: readonly SeatDto[];
}

/** Static floor layout, sent once on join. `tiles` is row-major and `width * height` long. */
export interface FloorDto {
  readonly width: number;
  readonly height: number;
  readonly tiles: readonly TileKind[];
  readonly tables: readonly TableDto[];
}

export type BodyShape = 'circle' | 'square' | 'diamond';

export interface AppearanceDto {
  readonly bodyColor: string;
  readonly outlineColor: string;
  readonly shape: BodyShape;
}

export type RoundOutcome = 'win' | 'loss' | 'push';

export interface PlayerDto {
  readonly id: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
  readonly appearance: AppearanceDto;
  readonly pos: GridPos;
  readonly seatId: string | null;
  readonly chips: number;
  readonly autoPlay: boolean;
  readonly activity: string;
  /** Latest settled round, so clients can float "+20" over the player when it changes. */
  readonly lastRound: { readonly id: string; readonly net: number } | null;
}

export interface WorldSnapshotDto {
  readonly tick: number;
  readonly simSpeed: SimSpeed;
  readonly players: readonly PlayerDto[];
}

export interface RoundViewDto {
  readonly roundId: string;
  readonly gameId: GameId;
  readonly status: 'pending' | 'settled';
  readonly wager: number;
  readonly payout: number;
  readonly outcome: RoundOutcome | null;
  readonly headline: string;
  readonly details: readonly string[];
  /** Decisions the player can make while the round is pending. */
  readonly actions: readonly string[];
  readonly itemId: string | null;
}

export interface InventoryItemDto {
  readonly instanceId: string;
  readonly itemId: string;
  readonly gameId: GameId;
  readonly usesLeft: number;
  readonly active: boolean;
}

/** State only the owning player receives. */
export interface SelfStateDto {
  readonly playerId: PlayerId;
  readonly chips: number;
  readonly pos: GridPos;
  readonly inventory: readonly InventoryItemDto[];
  readonly table: { readonly tableId: string; readonly gameId: GameId } | null;
  readonly round: RoundViewDto | null;
  readonly atShop: boolean;
  readonly autoPlay: boolean;
  readonly requestedSpeed: SimSpeed;
}

export interface BetOptionDto {
  readonly id: string;
  readonly label: string;
  readonly payout: string;
  /** Long-run payout / wager of this bet without items. */
  readonly theoreticalRtp: number;
  /** When set, the bet also needs a number in this range and is sent as `${id}:${n}`. */
  readonly numberRange: { readonly min: number; readonly max: number } | null;
}

export interface GameInfoDto {
  readonly id: GameId;
  readonly name: string;
  readonly minBet: number;
  readonly maxBet: number;
  readonly theoreticalRtp: number;
  readonly betOptions: readonly BetOptionDto[];
}

export interface ItemDefinitionDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly gameId: GameId;
  readonly price: number;
  readonly boost: number;
  readonly uses: number;
}

import type { GameId, PlayerId, PlayerKind, RoundOutcome } from '@casino/contracts';

interface PlayerEvent {
  /** Epoch ms from the injected clock. */
  readonly at: number;
  readonly playerId: PlayerId;
  readonly playerKind: PlayerKind;
}

export interface PlayerJoined extends PlayerEvent {
  readonly type: 'PlayerJoined';
  readonly name: string;
  readonly chips: number;
}

export interface PlayerLeft extends PlayerEvent {
  readonly type: 'PlayerLeft';
}

export interface BetPlaced extends PlayerEvent {
  readonly type: 'BetPlaced';
  readonly roundId: string;
  readonly gameId: GameId;
  readonly amount: number;
  readonly option: string;
  readonly itemId: string | null;
}

export interface PayoutSettled extends PlayerEvent {
  readonly type: 'PayoutSettled';
  readonly roundId: string;
  readonly gameId: GameId;
  readonly wager: number;
  /** Chips handed back, stake included; 0 on a loss. */
  readonly payout: number;
  readonly outcome: RoundOutcome;
  readonly itemId: string | null;
}

export interface ItemUsed extends PlayerEvent {
  readonly type: 'ItemUsed';
  readonly roundId: string;
  readonly gameId: GameId;
  readonly itemId: string;
  readonly boost: number;
  readonly usesLeft: number;
}

export interface ItemPurchased extends PlayerEvent {
  readonly type: 'ItemPurchased';
  readonly itemId: string;
  readonly price: number;
}

export interface ChipsGranted extends PlayerEvent {
  readonly type: 'ChipsGranted';
  readonly amount: number;
}

/** Everything that happens to chips or items is one of these. */
export type DomainEvent =
  | PlayerJoined
  | PlayerLeft
  | BetPlaced
  | PayoutSettled
  | ItemUsed
  | ItemPurchased
  | ChipsGranted;

export type DomainEventType = DomainEvent['type'];

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An event before the recorder stamps the time and player on it. */
export type DomainEventData = DistributiveOmit<DomainEvent, keyof PlayerEvent>;

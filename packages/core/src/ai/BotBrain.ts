import type { GameId, GridPos, PlayerCommand } from '@casino/contracts';
import type { Seat } from '../floor/FloorMap.ts';
import type { CasinoGame } from '../games/CasinoGame.ts';
import { nearest } from '../grid/gridMath.ts';
import type { ItemDefinition } from '../items/ItemDefinition.ts';
import type { Player } from '../players/Player.ts';
import type { Rng } from '../random/Rng.ts';
import { WeightedTable } from '../random/WeightedTable.ts';
import type { BrainView } from './BrainView.ts';
import type { Personality } from './Personality.ts';

type Errand =
  | { readonly to: 'table' }
  | { readonly to: 'shop'; readonly itemId: string }
  | { readonly to: 'stroll' }
  | { readonly to: 'exit' };

type Goal =
  | { readonly kind: 'idle' }
  | { readonly kind: 'walk'; readonly errand: Errand }
  | { readonly kind: 'play'; readonly roundsLeft: number }
  | { readonly kind: 'gone' };

/** Bots head home once they can't cover a decent bet. */
const LEAVE_BELOW_CHIPS = 20;
/** Bots only buy items costing at most this share of their chips. */
const MAX_ITEM_SPEND_SHARE = 0.2;

/**
 * The one AI used by every bot and by guests on auto-play. It picks an errand (play, shop,
 * stroll or leave), walks there and plays, issuing the same commands a human client sends.
 * Personalities only change the numbers.
 */
export class BotBrain {
  readonly personality: Personality;
  private readonly rng: Rng;
  private goal: Goal = { kind: 'idle' };
  private nextActionAt = 0;

  constructor(personality: Personality, rng: Rng) {
    this.personality = personality;
    this.rng = rng;
  }

  /** True once a broke bot has walked out of the casino. */
  get hasLeft(): boolean {
    return this.goal.kind === 'gone';
  }

  /** The next command for this player, or null to keep waiting. */
  decide(player: Player, view: BrainView): PlayerCommand | null {
    if (this.goal.kind === 'gone' || player.isMoving || view.tick < this.nextActionAt) return null;
    this.nextActionAt = view.tick + this.between(this.personality.thinkTicks);
    if (player.pendingRound) return this.decideRound(player, view);
    if (this.goal.kind === 'walk') return this.arrive(player, view, this.goal.errand);
    if (this.goal.kind === 'play') return this.playRound(player, view, this.goal.roundsLeft);
    return this.startErrand(player, view);
  }

  private decideRound(player: Player, view: BrainView): PlayerCommand | null {
    const round = player.pendingRound;
    const game = round ? view.games.get(round.gameId) : undefined;
    if (!round || !game) return null;
    const action = game.suggestAction?.(round.state) ?? round.actions[0];
    return action === undefined ? null : { type: 'roundAction', action };
  }

  private startErrand(player: Player, view: BrainView): PlayerCommand | null {
    const { floor } = view;
    if (player.kind === 'bot' && player.chips < LEAVE_BELOW_CHIPS) {
      return this.walk({ to: 'exit' }, nearest(player.pos, floor.entrances));
    }
    const roll = this.rng.next();
    const { shopChance, strollChance } = this.personality;
    const wanted = roll < shopChance ? this.wishlistItem(player, view) : undefined;
    if (wanted) {
      return this.walk({ to: 'shop', itemId: wanted.id }, nearest(player.pos, floor.shopTiles));
    }
    if (roll < shopChance + strollChance) {
      return this.walk({ to: 'stroll' }, this.rng.pick(floor.walkableTiles));
    }
    return this.walk({ to: 'table' }, this.chooseSeat(player, view)?.pos);
  }

  private walk(errand: Errand, target: GridPos | undefined): PlayerCommand | null {
    if (!target) return null;
    this.goal = { kind: 'walk', errand };
    return { type: 'moveTo', target };
  }

  private arrive(player: Player, view: BrainView, errand: Errand): PlayerCommand | null {
    this.goal = { kind: 'idle' };
    if (errand.to === 'table' && player.seated) {
      this.goal = { kind: 'play', roundsLeft: this.between(this.personality.roundsPerVisit) };
    }
    if (errand.to === 'exit' && view.floor.isEntrance(player.pos)) this.goal = { kind: 'gone' };
    if (errand.to === 'shop' && view.floor.isShop(player.pos)) {
      return { type: 'buyItem', itemId: errand.itemId };
    }
    return null;
  }

  private playRound(player: Player, view: BrainView, roundsLeft: number): PlayerCommand | null {
    const game = view.gameAt(player);
    if (!game || roundsLeft <= 0 || player.chips < game.minBet) {
      this.goal = { kind: 'idle' };
      return player.seated ? { type: 'leaveSeat' } : null;
    }
    const spareItem = this.inactiveItemFor(player, game);
    if (spareItem) return { type: 'toggleItem', instanceId: spareItem };
    this.goal = { kind: 'play', roundsLeft: roundsLeft - 1 };
    return { type: 'placeBet', amount: this.betAmount(player, game), option: this.betOption(game) };
  }

  /** An owned item for this game while none is active, so the brain puts it to use. */
  private inactiveItemFor(player: Player, game: CasinoGame): string | undefined {
    if (player.inventory.activeFor(game.id)) return undefined;
    return player.inventory.items().find((item) => item.gameId === game.id)?.instanceId;
  }

  private betAmount(player: Player, game: CasinoGame): number {
    const wanted = Math.round(player.chips * this.personality.betFraction);
    return Math.max(game.minBet, Math.min(wanted, game.maxBet, player.chips));
  }

  private betOption(game: CasinoGame): string {
    const option = this.rng.pick(game.betOptions);
    if (!option.numberRange) return option.id;
    const { min, max } = option.numberRange;
    return `${option.id}:${min + this.rng.int(max - min + 1)}`;
  }

  /** A free seat at a game picked by this personality's appetite. */
  private chooseSeat(player: Player, view: BrainView): Seat | undefined {
    const seatsByGame = new Map<GameId, Seat[]>();
    for (const table of view.floor.tables) {
      const game = view.games.get(table.gameId);
      if (!game || player.chips < game.minBet) continue;
      const seats = seatsByGame.get(game.id) ?? [];
      seats.push(...view.availableSeats(table, player.id));
      if (seats.length > 0) seatsByGame.set(game.id, seats);
    }
    if (seatsByGame.size === 0) return undefined;
    const games = [...seatsByGame.keys()].map((id) => ({ value: id, weight: this.appetite(id) }));
    const seats = seatsByGame.get(new WeightedTable(games).pick(this.rng));
    return seats ? this.rng.pick(seats) : undefined;
  }

  /** An affordable item the player doesn't own yet, favouring games this personality likes. */
  private wishlistItem(player: Player, view: BrainView): ItemDefinition | undefined {
    const owned = new Set(player.inventory.items().map((item) => item.itemId));
    const budget = player.chips * MAX_ITEM_SPEND_SHARE;
    const affordable = view.catalog
      .all()
      .filter((item) => !owned.has(item.id) && item.price <= budget);
    if (affordable.length === 0) return undefined;
    const weighted = affordable.map((item) => ({
      value: item,
      weight: this.appetite(item.gameId),
    }));
    return new WeightedTable(weighted).pick(this.rng);
  }

  private appetite(gameId: GameId): number {
    return this.personality.gameWeights[gameId] ?? 1;
  }

  private between([min, max]: readonly [number, number]): number {
    return min + this.rng.int(max - min + 1);
  }
}

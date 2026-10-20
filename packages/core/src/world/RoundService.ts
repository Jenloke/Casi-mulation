import type { RoundOutcome } from '@casino/contracts';
import type { EventRecorder } from '../events/EventRecorder.ts';
import type { FloorMap } from '../floor/FloorMap.ts';
import type { CasinoGame, RoundContext, RoundStep } from '../games/CasinoGame.ts';
import type { GameRegistry } from '../games/GameRegistry.ts';
import type { IdGenerator } from '../ids/IdGenerator.ts';
import type { ItemCatalog } from '../items/ItemCatalog.ts';
import { MAX_ODDS_BOOST } from '../items/ItemDefinition.ts';
import type { Player } from '../players/Player.ts';
import type { Rng } from '../random/Rng.ts';
import type { RoundTicket } from '../rounds/RoundRecords.ts';
import { type CommandResult, OK, rejected } from './CommandResult.ts';

export interface RoundServiceDeps {
  readonly floor: FloorMap;
  readonly games: GameRegistry;
  readonly catalog: ItemCatalog;
  readonly recorder: EventRecorder;
  readonly rng: Rng;
  readonly ids: IdGenerator;
}

/** No sane round needs more decisions than this; past it the round is forfeited. */
const MAX_AUTO_DECISIONS = 50;

/**
 * Plays rounds for seated players: takes the bet, applies the active item, pays out,
 * and records every bet, item use and payout as a domain event.
 */
export class RoundService {
  private readonly deps: RoundServiceDeps;

  constructor(deps: RoundServiceDeps) {
    this.deps = deps;
  }

  /** The game at the player's seat, once they are sitting. */
  gameAt(player: Player): CasinoGame | undefined {
    if (!player.seated || player.seatId === null) return undefined;
    const seat = this.deps.floor.seat(player.seatId);
    const table = seat ? this.deps.floor.table(seat.tableId) : undefined;
    return table ? this.deps.games.get(table.gameId) : undefined;
  }

  placeBet(player: Player, amount: number, option: string): CommandResult {
    const game = this.gameAt(player);
    if (!game) return rejected('Sit down at a table first');
    if (player.pendingRound) return rejected('Finish the current round first');
    if (!Number.isInteger(amount) || amount < game.minBet || amount > game.maxBet) {
      return rejected(`${game.name} bets are ${game.minBet} to ${game.maxBet} chips`);
    }
    if (!player.canAfford(amount)) return rejected('Not enough chips');
    if (!game.isValidOption(option)) return rejected(`Unknown ${game.name} bet '${option}'`);

    const owned = player.inventory.activeFor(game.id);
    const item = owned ? this.deps.catalog.get(owned.itemId) : undefined;
    const ticket: RoundTicket = {
      roundId: this.deps.ids.next('round'),
      gameId: game.id,
      wager: amount,
      itemId: item?.id ?? null,
      boost: item ? Math.min(item.boost, MAX_ODDS_BOOST) : 0,
    };
    player.debit(amount);
    this.deps.recorder.record(player, {
      type: 'BetPlaced',
      roundId: ticket.roundId,
      gameId: game.id,
      amount,
      option,
      itemId: ticket.itemId,
    });
    if (owned && item) {
      const usesLeft = player.inventory.consumeUse(owned.instanceId);
      this.deps.recorder.record(player, {
        type: 'ItemUsed',
        roundId: ticket.roundId,
        gameId: game.id,
        itemId: item.id,
        boost: ticket.boost,
        usesLeft,
      });
    }
    this.advance(player, ticket, game.startRound({ amount, option }, this.context(ticket)));
    return OK;
  }

  act(player: Player, action: string): CommandResult {
    const round = player.pendingRound;
    if (!round) return rejected('No round in progress');
    if (!round.actions.includes(action)) return rejected(`You can't ${action} right now`);
    const game = this.deps.games.get(round.gameId);
    if (!game?.applyAction) return rejected(`${round.gameId} has no decisions to make`);
    this.advance(player, round, game.applyAction(round.state, action, this.context(round)));
    return OK;
  }

  /** Plays a pending round to the end with the AI's choices, e.g. when its player leaves. */
  finishPending(player: Player): void {
    for (let decisions = 0; player.pendingRound; decisions++) {
      const round = player.pendingRound;
      const game = this.deps.games.get(round.gameId);
      const action = game?.suggestAction?.(round.state) ?? round.actions[0];
      if (decisions >= MAX_AUTO_DECISIONS || action === undefined || !this.act(player, action).ok) {
        const forfeit = { headline: 'Round forfeited', details: [] };
        this.advance(player, round, { status: 'settled', payout: 0, view: forfeit });
      }
    }
  }

  private advance(player: Player, round: RoundTicket, step: RoundStep<unknown>): void {
    const ticket: RoundTicket = {
      roundId: round.roundId,
      gameId: round.gameId,
      wager: round.wager,
      itemId: round.itemId,
      boost: round.boost,
    };
    if (step.status === 'pending') {
      player.pendingRound = {
        ...ticket,
        state: step.state,
        actions: step.actions,
        view: step.view,
      };
      return;
    }
    const outcome = outcomeOf(ticket.wager, step.payout);
    player.pendingRound = null;
    player.credit(step.payout);
    player.lastRound = { ...ticket, payout: step.payout, outcome, view: step.view };
    this.deps.recorder.record(player, {
      type: 'PayoutSettled',
      roundId: ticket.roundId,
      gameId: ticket.gameId,
      wager: ticket.wager,
      payout: step.payout,
      outcome,
      itemId: ticket.itemId,
    });
  }

  private context(round: RoundTicket): RoundContext {
    return { rng: this.deps.rng, boost: round.boost };
  }
}

function outcomeOf(wager: number, payout: number): RoundOutcome {
  if (payout > wager) return 'win';
  return payout === wager ? 'push' : 'loss';
}

import type {
  FloorDto,
  GameInfoDto,
  ItemDefinitionDto,
  PlayerDto,
  RoundViewDto,
  SelfStateDto,
  SimSpeed,
  WorldSnapshotDto,
} from '@casino/contracts';
import type { FloorMap } from '../floor/FloorMap.ts';
import type { GameRegistry } from '../games/GameRegistry.ts';
import type { ItemCatalog } from '../items/ItemCatalog.ts';
import type { Player } from '../players/Player.ts';
import type { PendingRound, SettledRound } from '../rounds/RoundRecords.ts';
import type { RoundService } from './RoundService.ts';

export interface WorldSnapshotterDeps {
  readonly floor: FloorMap;
  readonly games: GameRegistry;
  readonly catalog: ItemCatalog;
  readonly rounds: RoundService;
}

/** Turns world state into the DTOs sent to clients. */
export class WorldSnapshotter {
  private readonly deps: WorldSnapshotterDeps;

  constructor(deps: WorldSnapshotterDeps) {
    this.deps = deps;
  }

  floorDto(): FloorDto {
    const { floor, games } = this.deps;
    return {
      width: floor.width,
      height: floor.height,
      tiles: floor.tiles,
      tables: floor.tables.map((table) => ({
        id: table.id,
        gameId: table.gameId,
        label: `${games.get(table.gameId)?.name ?? table.gameId} ${table.number}`,
        tiles: table.tiles,
        seats: table.seats.map((seat) => ({ id: seat.id, pos: seat.pos })),
      })),
    };
  }

  gameInfos(): GameInfoDto[] {
    return this.deps.games.all().map((game) => ({
      id: game.id,
      name: game.name,
      minBet: game.minBet,
      maxBet: game.maxBet,
      theoreticalRtp: game.theoreticalRtp,
      betOptions: game.betOptions,
    }));
  }

  itemInfos(): ItemDefinitionDto[] {
    return this.deps.catalog.all().map((item) => ({ ...item }));
  }

  worldDto(tick: number, simSpeed: SimSpeed, players: readonly Player[]): WorldSnapshotDto {
    return { tick, simSpeed, players: players.map((player) => this.playerDto(player)) };
  }

  selfDto(player: Player): SelfStateDto {
    const { floor } = this.deps;
    const { inventory } = player;
    const seat = player.seated && player.seatId !== null ? floor.seat(player.seatId) : undefined;
    const table = seat ? floor.table(seat.tableId) : undefined;
    return {
      playerId: player.id,
      chips: player.chips,
      pos: player.pos,
      inventory: inventory
        .items()
        .map((item) => ({ ...item, active: inventory.isActive(item.instanceId) })),
      table: table ? { tableId: table.id, gameId: table.gameId } : null,
      round: this.roundView(player),
      atShop: floor.isShop(player.pos) && !player.isMoving,
      autoPlay: player.autoPlay,
      requestedSpeed: player.requestedSpeed,
    };
  }

  private playerDto(player: Player): PlayerDto {
    const last = player.lastRound;
    return {
      id: player.id,
      name: player.name,
      kind: player.kind,
      appearance: player.profile.appearance,
      pos: player.pos,
      seatId: player.seated ? player.seatId : null,
      chips: player.chips,
      autoPlay: player.autoPlay,
      activity: this.activity(player),
      lastRound: last ? { id: last.roundId, net: last.payout - last.wager } : null,
    };
  }

  private activity(player: Player): string {
    if (player.isMoving) return 'walking';
    const game = this.deps.rounds.gameAt(player);
    if (game) return `playing ${game.name}`;
    return this.deps.floor.isShop(player.pos) ? 'shopping' : 'idle';
  }

  private roundView(player: Player): RoundViewDto | null {
    if (player.pendingRound) return this.pendingView(player.pendingRound);
    return player.lastRound ? this.settledView(player.lastRound) : null;
  }

  private pendingView(round: PendingRound): RoundViewDto {
    return {
      roundId: round.roundId,
      gameId: round.gameId,
      status: 'pending',
      wager: round.wager,
      payout: 0,
      outcome: null,
      headline: round.view.headline,
      details: round.view.details,
      actions: round.actions,
      itemId: round.itemId,
    };
  }

  private settledView(round: SettledRound): RoundViewDto {
    return {
      roundId: round.roundId,
      gameId: round.gameId,
      status: 'settled',
      wager: round.wager,
      payout: round.payout,
      outcome: round.outcome,
      headline: round.view.headline,
      details: round.view.details,
      actions: [],
      itemId: round.itemId,
    };
  }
}

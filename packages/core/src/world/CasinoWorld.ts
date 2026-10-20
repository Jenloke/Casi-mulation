import type {
  FloorDto,
  GameInfoDto,
  ItemDefinitionDto,
  PlayerCommand,
  PlayerId,
  PlayerKind,
  SelfStateDto,
  SimSpeed,
  WorldSnapshotDto,
} from '@casino/contracts';
import { BotBrain } from '../ai/BotBrain.ts';
import { BotDirector } from '../ai/BotDirector.ts';
import { BrainRegistry } from '../ai/BrainRegistry.ts';
import type { BrainView } from '../ai/BrainView.ts';
import { AUTO_PLAY_PERSONALITY, PERSONALITIES } from '../ai/personalities.ts';
import type { DomainEventPublisher } from '../events/DomainEventBus.ts';
import { EventRecorder } from '../events/EventRecorder.ts';
import { CASINO_FLOOR } from '../floor/casinoFloor.ts';
import type { FloorMap } from '../floor/FloorMap.ts';
import { FloorMapParser } from '../floor/FloorMapParser.ts';
import { createDefaultGameRegistry } from '../games/defaultGames.ts';
import type { GameRegistry } from '../games/GameRegistry.ts';
import { samePos } from '../grid/gridMath.ts';
import { IdGenerator } from '../ids/IdGenerator.ts';
import { ItemCatalog } from '../items/ItemCatalog.ts';
import type { ItemDefinition } from '../items/ItemDefinition.ts';
import { ITEM_DEFINITIONS } from '../items/itemDefinitions.ts';
import { type CharacterProfile, DEFAULT_CHARACTER_PROFILE } from '../players/CharacterProfile.ts';
import { Player } from '../players/Player.ts';
import { InMemoryPlayerRepository, type PlayerRepository } from '../players/PlayerRepository.ts';
import type { Rng } from '../random/Rng.ts';
import type { Clock } from '../time/Clock.ts';
import { ChipBank } from './ChipBank.ts';
import { CommandHandler } from './CommandHandler.ts';
import { type CommandResult, OK, rejected } from './CommandResult.ts';
import { MovementSystem } from './MovementSystem.ts';
import { Navigator } from './Navigator.ts';
import { RoundService } from './RoundService.ts';
import { SeatingService } from './SeatingService.ts';
import { ShopService } from './ShopService.ts';
import { TimeScale } from './TimeScale.ts';
import { WorldSnapshotter } from './WorldSnapshotter.ts';

/** Simulated time per tick. */
export const TICK_MS = 100;
const TICKS_PER_STEP = 2;
const STARTING_CHIPS = 1000;
const DEFAULT_BOT_COUNT = 8;

export interface CasinoWorldOptions {
  readonly rng: Rng;
  readonly clock: Clock;
  readonly events: DomainEventPublisher;
  readonly floor?: FloorMap;
  readonly games?: GameRegistry;
  readonly items?: readonly ItemDefinition[];
  readonly players?: PlayerRepository;
  readonly botCount?: number;
}

/**
 * The authoritative casino simulation. A host calls `advance()` once per tick and
 * `execute()` for player input, and reads snapshots back out.
 */
export class CasinoWorld {
  readonly floor: FloorMap;
  readonly games: GameRegistry;
  readonly catalog: ItemCatalog;
  private readonly rng: Rng;
  private readonly players: PlayerRepository;
  private readonly recorder: EventRecorder;
  private readonly ids = new IdGenerator();
  private readonly seating = new SeatingService();
  private readonly movement = new MovementSystem(TICKS_PER_STEP);
  private readonly brains = new BrainRegistry();
  private readonly timeScale = new TimeScale();
  private readonly rounds: RoundService;
  private readonly bank: ChipBank;
  private readonly director: BotDirector;
  private readonly commands: CommandHandler;
  private readonly snapshotter: WorldSnapshotter;
  private tickCount = 0;
  private guestCount = 0;

  constructor(options: CasinoWorldOptions) {
    this.rng = options.rng;
    this.floor = options.floor ?? new FloorMapParser().parse(CASINO_FLOOR);
    this.games = options.games ?? createDefaultGameRegistry();
    this.catalog = new ItemCatalog(options.items ?? ITEM_DEFINITIONS, this.games);
    this.players = options.players ?? new InMemoryPlayerRepository();
    this.recorder = new EventRecorder(options.events, options.clock);
    const { floor, games, catalog, recorder, ids } = this;
    this.rounds = new RoundService({ floor, games, catalog, recorder, rng: this.rng, ids });
    const lowestBet = Math.min(...games.all().map((game) => game.minBet));
    this.bank = new ChipBank(recorder, STARTING_CHIPS, lowestBet);
    this.director = new BotDirector(options.botCount ?? DEFAULT_BOT_COUNT, PERSONALITIES);
    this.commands = new CommandHandler({
      navigator: new Navigator(floor, this.seating),
      rounds: this.rounds,
      shop: new ShopService({ floor, catalog, recorder, ids }),
      setAutoPlay: (player, enabled) => this.setAutoPlay(player, enabled),
    });
    this.snapshotter = new WorldSnapshotter({ floor, games, catalog, rounds: this.rounds });
  }

  get tick(): number {
    return this.tickCount;
  }

  get simSpeed(): SimSpeed {
    return this.timeScale.speedFor(this.players.all());
  }

  /** A guest walks in through the entrance. */
  join(profile: CharacterProfile = DEFAULT_CHARACTER_PROFILE): Player {
    this.guestCount++;
    const named = { ...profile, name: `${profile.name} ${this.guestCount}` };
    return this.addPlayer('human', named, STARTING_CHIPS);
  }

  /** Removes a player, first playing out any round they left open. */
  leave(playerId: PlayerId): void {
    const player = this.players.get(playerId);
    if (!player) return;
    this.rounds.finishPending(player);
    this.seating.release(player.id);
    this.brains.detach(player.id);
    this.players.remove(player.id);
    this.recorder.record(player, { type: 'PlayerLeft' });
  }

  /** A command from a human client. Brains issue theirs during `advance()`. */
  execute(playerId: PlayerId, command: PlayerCommand): CommandResult {
    const player = this.players.get(playerId);
    if (!player) return rejected('Unknown player');
    const controlsAutoPlay = command.type === 'setAutoPlay' || command.type === 'setSimSpeed';
    if (player.autoPlay && !controlsAutoPlay) return rejected('Auto-play is on');
    return this.commands.handle(player, command);
  }

  /** One simulation tick: bots come and go, brains decide, everyone walks. */
  advance(): void {
    this.tickCount++;
    this.admitBot();
    const view = this.brainView();
    for (const [playerId, brain] of this.brains.entries()) {
      const player = this.players.get(playerId);
      const command = player ? brain.decide(player, view) : null;
      if (player && command) this.commands.handle(player, command);
    }
    for (const player of this.players.all()) {
      if (this.movement.advance(player)) this.sitIfAtSeat(player);
      this.bank.topUpIfBroke(player);
    }
    for (const [playerId, brain] of this.brains.entries()) {
      if (brain.hasLeft) this.leave(playerId);
    }
  }

  player(id: PlayerId): Player | undefined {
    return this.players.get(id);
  }

  allPlayers(): readonly Player[] {
    return this.players.all();
  }

  floorDto(): FloorDto {
    return this.snapshotter.floorDto();
  }

  gameInfos(): GameInfoDto[] {
    return this.snapshotter.gameInfos();
  }

  itemInfos(): ItemDefinitionDto[] {
    return this.snapshotter.itemInfos();
  }

  snapshot(): WorldSnapshotDto {
    return this.snapshotter.worldDto(this.tickCount, this.simSpeed, this.players.all());
  }

  selfState(playerId: PlayerId): SelfStateDto | undefined {
    const player = this.players.get(playerId);
    return player ? this.snapshotter.selfDto(player) : undefined;
  }

  private setAutoPlay(player: Player, enabled: boolean): CommandResult {
    if (player.kind !== 'human') return rejected('Only guests can toggle auto-play');
    player.autoPlay = enabled;
    if (enabled)
      this.brains.attach(player.id, new BotBrain(AUTO_PLAY_PERSONALITY, this.rng.fork()));
    else this.brains.detach(player.id);
    return OK;
  }

  private sitIfAtSeat(player: Player): void {
    const seat = player.seatId === null ? undefined : this.floor.seat(player.seatId);
    if (seat && samePos(seat.pos, player.pos)) player.seated = true;
  }

  private admitBot(): void {
    const botsOnFloor = this.players.all().filter((player) => player.kind === 'bot').length;
    const arrival = this.director.nextArrival(this.tickCount, botsOnFloor);
    if (!arrival) return;
    const { personality, name } = arrival;
    const profile = { name, appearance: personality.appearance };
    const bot = this.addPlayer('bot', profile, personality.startingChips);
    this.brains.attach(bot.id, new BotBrain(personality, this.rng.fork()));
  }

  private addPlayer(kind: PlayerKind, profile: CharacterProfile, chips: number): Player {
    const id = this.ids.next(kind === 'human' ? 'guest' : 'bot');
    const player = new Player({
      id,
      kind,
      profile,
      chips,
      pos: this.rng.pick(this.floor.entrances),
    });
    this.players.add(player);
    this.recorder.record(player, { type: 'PlayerJoined', name: profile.name, chips });
    return player;
  }

  private brainView(): BrainView {
    return {
      tick: this.tickCount,
      floor: this.floor,
      games: this.games,
      catalog: this.catalog,
      availableSeats: (table, playerId) => this.seating.availableSeats(table, playerId),
      gameAt: (player) => this.rounds.gameAt(player),
    };
  }
}

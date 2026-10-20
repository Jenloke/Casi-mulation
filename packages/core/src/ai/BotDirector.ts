import type { Personality } from './Personality.ts';

const BOT_NAMES = [
  'Ada',
  'Bo',
  'Cass',
  'Dex',
  'Edie',
  'Finn',
  'Gus',
  'Hana',
  'Ira',
  'Jo',
  'Kit',
  'Lou',
  'Mae',
  'Nico',
  'Otto',
  'Pia',
  'Quin',
  'Rex',
  'Sol',
  'Tess',
];

/** Ticks between two bots walking in, so they don't all arrive at once. */
const SPAWN_GAP_TICKS = 5;

export interface BotArrival {
  readonly personality: Personality;
  readonly name: string;
}

/** Keeps the floor at the target bot count, cycling through personalities and names. */
export class BotDirector {
  private readonly targetCount: number;
  private readonly personalities: readonly Personality[];
  private arrivals = 0;
  private nextArrivalTick = 0;

  constructor(targetCount: number, personalities: readonly Personality[]) {
    this.targetCount = targetCount;
    this.personalities = personalities;
  }

  /** The bot that should walk in this tick, if the floor is short of one. */
  nextArrival(tick: number, botsOnFloor: number): BotArrival | null {
    if (botsOnFloor >= this.targetCount || tick < this.nextArrivalTick) return null;
    const personality = this.personalities[this.arrivals % this.personalities.length];
    if (!personality) return null;
    const lap = Math.floor(this.arrivals / BOT_NAMES.length);
    const baseName = BOT_NAMES[this.arrivals % BOT_NAMES.length] ?? 'Bot';
    this.arrivals++;
    this.nextArrivalTick = tick + SPAWN_GAP_TICKS;
    return { personality, name: lap === 0 ? baseName : `${baseName} ${lap + 1}` };
  }
}

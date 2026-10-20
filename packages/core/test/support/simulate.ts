import type { CasinoGame, RoundStep } from '../../src/games/CasinoGame.ts';
import { SeededRng } from '../../src/random/SeededRng.ts';

export interface RtpSample {
  readonly rtp: number;
  /** Standard error of the RTP estimate. */
  readonly standardError: number;
}

export interface SimulationOptions {
  readonly rounds: number;
  readonly seed: number;
  readonly boost: number;
  readonly option: string;
}

/** Plays many minimum-bet rounds with the game's own suggested decisions and measures payout / wager. */
export function simulateRtp(game: CasinoGame, options: SimulationOptions): RtpSample {
  const ctx = { rng: new SeededRng(options.seed), boost: options.boost };
  const wager = { amount: game.minBet, option: options.option };
  let sum = 0;
  let sumOfSquares = 0;
  for (let round = 0; round < options.rounds; round++) {
    let step: RoundStep<unknown> = game.startRound(wager, ctx);
    while (step.status === 'pending') {
      const action = game.suggestAction?.(step.state) ?? step.actions[0];
      if (!game.applyAction || action === undefined)
        throw new Error(`${game.id} left a round open`);
      step = game.applyAction(step.state, action, ctx);
    }
    const ratio = step.payout / wager.amount;
    sum += ratio;
    sumOfSquares += ratio * ratio;
  }
  const rtp = sum / options.rounds;
  const variance = sumOfSquares / options.rounds - rtp * rtp;
  return { rtp, standardError: Math.sqrt(variance / options.rounds) };
}

/** One option string per bet option; numbered options get a mid-range number. */
export function optionsToTest(game: CasinoGame): string[] {
  return game.betOptions.map((option) => {
    if (!option.numberRange) return option.id;
    const { min, max } = option.numberRange;
    return `${option.id}:${Math.floor((min + max) / 2)}`;
  });
}

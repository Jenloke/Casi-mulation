import { COUP_WINNERS, type CoupWinner, coupOdds } from './coup.ts';

/** A bet backs one of the coup's outcomes: the player hand, the banker hand or a tie. */
export type BaccaratBet = CoupWinner;

/** What each bet hands back, stake included, and what that returns in the long run. */
export class BaccaratPaytable {
  private readonly odds = coupOdds();

  parseBet(option: string): BaccaratBet | null {
    return COUP_WINNERS.find((bet) => bet === option) ?? null;
  }

  /** Player pays 1:1, banker 0.95:1, tie 8:1; a tie hands player and banker bets back. */
  payout(bet: BaccaratBet, winner: CoupWinner, wager: number): number {
    if (winner === 'tie') return bet === 'tie' ? wager * 9 : wager;
    if (bet !== winner) return 0;
    return bet === 'banker' ? wager * 2 - commission(wager) : wager * 2;
  }

  /** Exact return per chip staked. Commission rounding makes it depend on the stake. */
  expectedReturn(bet: BaccaratBet, wager: number): number {
    let total = 0;
    for (const winner of COUP_WINNERS) total += this.odds[winner] * this.payout(bet, winner, wager);
    return total / wager;
  }
}

/** The house keeps 5% of a banker win, rounded up to a whole chip. */
function commission(wager: number): number {
  return Math.ceil(wager / 20);
}

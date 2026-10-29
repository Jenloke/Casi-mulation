import { describe, expect, it } from 'vitest';
import { BaccaratGame } from '../src/games/baccarat/BaccaratGame.ts';
import { BaccaratPaytable } from '../src/games/baccarat/BaccaratPaytable.ts';
import {
  bankerDraws,
  coupOdds,
  coupWinner,
  dealCoup,
  handTotal,
} from '../src/games/baccarat/coup.ts';
import { BasicStrategy } from '../src/games/blackjack/BasicStrategy.ts';
import { BlackjackGame, type BlackjackState } from '../src/games/blackjack/BlackjackGame.ts';
import { handValue, isBlackjack } from '../src/games/blackjack/hand.ts';
import type { Card, Rank } from '../src/games/cards.ts';
import { createDefaultGameRegistry } from '../src/games/defaultGames.ts';
import { RouletteWheel } from '../src/games/roulette/RouletteWheel.ts';
import { SlotPaytable } from '../src/games/slots/SlotPaytable.ts';
import { SlotsGame } from '../src/games/slots/SlotsGame.ts';
import { SeededRng } from '../src/random/SeededRng.ts';

const card = (rank: Rank): Card => ({ rank, suit: '♠' });
const cards = (...ranks: Rank[]): Card[] => ranks.map(card);

describe('slots', () => {
  const paytable = new SlotPaytable();

  it('pays three of a kind and two cherries', () => {
    expect(paytable.multiplier(['seven', 'seven', 'seven'])).toBe(100);
    expect(paytable.multiplier(['cherry', 'bell', 'cherry'])).toBe(2);
    expect(paytable.multiplier(['cherry', 'bell', 'bar'])).toBe(0);
  });

  it('has an exact theoretical RTP of 95.925%', () => {
    expect(new SlotsGame().theoreticalRtp).toBeCloseTo(0.95925, 10);
  });
});

describe('roulette wheel', () => {
  const wheel = new RouletteWheel();

  it('parses bets', () => {
    expect(wheel.parseBet('red')).toEqual({ kind: 'red' });
    expect(wheel.parseBet('straight:17')).toEqual({ kind: 'straight', number: 17 });
    expect(wheel.parseBet('straight:37')).toBeNull();
    expect(wheel.parseBet('purple')).toBeNull();
  });

  it('loses every outside bet on zero', () => {
    for (const kind of ['red', 'black', 'odd', 'even', 'low', 'high'] as const) {
      expect(wheel.wins({ kind }, 0)).toBe(false);
    }
    expect(wheel.wins({ kind: 'straight', number: 0 }, 0)).toBe(true);
  });

  it('knows its colours', () => {
    expect([wheel.color(0), wheel.color(1), wheel.color(2)]).toEqual(['green', 'red', 'black']);
  });
});

describe('blackjack', () => {
  const game = new BlackjackGame();
  const ctx = { rng: new SeededRng(1), boost: 0 };
  const state = (player: Card[], dealer: Card[]): BlackjackState => ({
    wager: 10,
    player,
    dealer,
    notes: [],
  });

  it('values hands with soft aces', () => {
    expect(handValue(cards('A', 'K'))).toEqual({ total: 21, soft: true });
    expect(handValue(cards('A', 'A', '9'))).toEqual({ total: 21, soft: true });
    expect(handValue(cards('K', 'Q', '5'))).toEqual({ total: 25, soft: false });
    expect(isBlackjack(cards('A', 'Q'))).toBe(true);
    expect(isBlackjack(cards('7', '7', '7'))).toBe(false);
  });

  it('follows hit/stand basic strategy', () => {
    const strategy = new BasicStrategy();
    expect(strategy.decide(cards('10', '6'), card('10'))).toBe('hit');
    expect(strategy.decide(cards('10', '6'), card('6'))).toBe('stand');
    expect(strategy.decide(cards('10', '2'), card('4'))).toBe('stand');
    expect(strategy.decide(cards('10', '2'), card('2'))).toBe('hit');
    expect(strategy.decide(cards('A', '7'), card('9'))).toBe('hit');
    expect(strategy.decide(cards('A', '7'), card('7'))).toBe('stand');
  });

  it('settles a stand against the dealer', () => {
    const settle = (player: Card[]) =>
      game.applyAction(state(player, cards('K', '7')), 'stand', ctx);
    expect(settle(cards('K', '9'))).toMatchObject({ status: 'settled', payout: 20 });
    expect(settle(cards('K', '7'))).toMatchObject({ status: 'settled', payout: 10 });
    expect(settle(cards('K', '6'))).toMatchObject({ status: 'settled', payout: 0 });
  });

  it('keeps the round open after a safe hit', () => {
    expect(game.applyAction(state(cards('2', '3'), cards('K', '7')), 'hit', ctx).status).toBe(
      'pending',
    );
  });
});

describe('baccarat', () => {
  const paytable = new BaccaratPaytable();
  /** Deals these ranks in order: player, banker, player, banker, then any third cards. */
  const deal = (...ranks: Rank[]) => {
    const shoe = cards(...ranks);
    return dealCoup(() => {
      const next = shoe.shift();
      if (!next) throw new Error('The scripted shoe ran out');
      return next;
    });
  };

  it('counts only the last digit, with tens and faces worth nothing', () => {
    expect(handTotal(cards('7', '8'))).toBe(5);
    expect(handTotal(cards('K', '9'))).toBe(9);
    expect(handTotal(cards('A', '10', 'Q'))).toBe(1);
  });

  it('stands both hands on a natural', () => {
    const coup = deal('4', '2', '4', '3');
    expect([coup.player.length, coup.banker.length]).toEqual([2, 2]);
    expect(coupWinner(coup)).toBe('player');
  });

  it('draws for the player on 0-5 and for the banker by the tableau', () => {
    // Player 5 draws an 8 (total 3); banker 3 stands against an 8: a tie.
    const tie = deal('2', 'A', '3', '2', '8');
    expect([handTotal(tie.player), handTotal(tie.banker)]).toEqual([3, 3]);
    expect(tie.banker).toHaveLength(2);
    expect(coupWinner(tie)).toBe('tie');
    // Player stands on 6; banker 5 draws a 4 to make 9.
    const banker = deal('6', '2', 'K', '3', '4');
    expect([banker.player.length, banker.banker.length]).toEqual([2, 3]);
    expect(coupWinner(banker)).toBe('banker');
  });

  it('follows the banker tableau', () => {
    expect([bankerDraws(2, 8), bankerDraws(3, 8), bankerDraws(3, 9)]).toEqual([true, false, true]);
    expect([bankerDraws(4, 1), bankerDraws(4, 2), bankerDraws(4, 8)]).toEqual([false, true, false]);
    expect([bankerDraws(5, 3), bankerDraws(5, 4), bankerDraws(5, 7)]).toEqual([false, true, true]);
    expect([bankerDraws(6, 5), bankerDraws(6, 6), bankerDraws(7, 6)]).toEqual([false, true, false]);
    expect([bankerDraws(5, null), bankerDraws(6, null)]).toEqual([true, false]);
  });

  it('pays 1:1, 0.95:1 and 8:1, and hands player and banker bets back on a tie', () => {
    expect(paytable.payout('player', 'player', 20)).toBe(40);
    expect(paytable.payout('banker', 'banker', 20)).toBe(39);
    expect(paytable.payout('banker', 'banker', 25)).toBe(48); // 1.25 commission rounds up to 2
    expect(paytable.payout('tie', 'tie', 20)).toBe(180);
    expect(paytable.payout('player', 'tie', 20)).toBe(20);
    expect(paytable.payout('banker', 'tie', 20)).toBe(20);
    expect(paytable.payout('tie', 'banker', 20)).toBe(0);
    expect(paytable.payout('player', 'banker', 20)).toBe(0);
  });

  it('has the exact infinite-shoe odds and returns', () => {
    const odds = coupOdds();
    expect(odds.player + odds.banker + odds.tie).toBeCloseTo(1, 12);
    const game = new BaccaratGame();
    const rtp = Object.fromEntries(game.betOptions.map((o) => [o.id, o.theoreticalRtp]));
    // House edges 1.228% (player), 1.064% (banker) and 14.117% (tie).
    expect(rtp.player).toBeCloseTo(0.98772, 5);
    expect(rtp.banker).toBeCloseTo(0.98936, 5);
    expect(rtp.tie).toBeCloseTo(0.85883, 5);
    expect(game.theoreticalRtp).toBe(rtp.banker);
  });

  it('re-deals a losing coup when the item boost comes through', () => {
    const game = new BaccaratGame();
    const ctx = { rng: new SeededRng(3), boost: 1 };
    const details = Array.from(
      { length: 20 },
      () => game.startRound({ amount: 20, option: 'tie' }, ctx).view.details,
    );
    expect(details.some((lines) => lines.some((line) => line.startsWith('Lucky re-deal')))).toBe(
      true,
    );
  });
});

describe('every game', () => {
  it.each(createDefaultGameRegistry().all())('$name quotes its best bet as its RTP', (game) => {
    const best = Math.max(...game.betOptions.map((option) => option.theoreticalRtp));
    expect(game.theoreticalRtp).toBe(best);
  });
});

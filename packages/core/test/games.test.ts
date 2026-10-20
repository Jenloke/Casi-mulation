import { describe, expect, it } from 'vitest';
import { BasicStrategy } from '../src/games/blackjack/BasicStrategy.ts';
import { BlackjackGame, type BlackjackState } from '../src/games/blackjack/BlackjackGame.ts';
import type { Card, Rank } from '../src/games/blackjack/cards.ts';
import { handValue, isBlackjack } from '../src/games/blackjack/hand.ts';
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

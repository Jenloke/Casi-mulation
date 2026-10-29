import { type Card, RANKS, type Rank } from '../cards.ts';

/** One deal of baccarat: two or three cards to each hand. */
export interface Coup {
  readonly player: readonly Card[];
  readonly banker: readonly Card[];
}

export type CoupWinner = 'player' | 'banker' | 'tie';
export const COUP_WINNERS: readonly CoupWinner[] = ['player', 'banker', 'tie'];

/** Baccarat value of a card: ace 1, two to nine at face value, tens and faces 0. */
export function rankPoints(rank: Rank): number {
  if (rank === 'A') return 1;
  if (rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K') return 0;
  return Number(rank);
}

/** A hand counts only its last digit: 7 and 8 make 5. */
export function handTotal(cards: readonly Card[]): number {
  return cards.reduce((sum, card) => sum + rankPoints(card.rank), 0) % 10;
}

/** A two-card 8 or 9 is a natural: neither hand draws. */
export function isNatural(cards: readonly Card[]): boolean {
  return cards.length === 2 && handTotal(cards) >= 8;
}

/** The player draws a third card on 0-5 and stands on 6 or 7. */
function playerDraws(total: number): boolean {
  return total <= 5;
}

/**
 * The banker's tableau. When the player stood, the banker draws on 0-5 like the player;
 * otherwise it depends on the points of the player's third card.
 */
export function bankerDraws(total: number, playerThird: number | null): boolean {
  if (playerThird === null) return total <= 5;
  if (total <= 2) return true;
  if (total === 3) return playerThird !== 8;
  if (total === 4) return playerThird >= 2 && playerThird <= 7;
  if (total === 5) return playerThird >= 4 && playerThird <= 7;
  if (total === 6) return playerThird === 6 || playerThird === 7;
  return false;
}

/** Deals a coup by the punto banco tableau. The rules decide every draw; nobody chooses. */
export function dealCoup(draw: () => Card): Coup {
  const player = [draw()];
  const banker = [draw()];
  player.push(draw());
  banker.push(draw());
  if (isNatural(player) || isNatural(banker)) return { player, banker };
  let playerThird: number | null = null;
  if (playerDraws(handTotal(player))) {
    const card = draw();
    player.push(card);
    playerThird = rankPoints(card.rank);
  }
  if (bankerDraws(handTotal(banker), playerThird)) banker.push(draw());
  return { player, banker };
}

export function coupWinner(coup: Coup): CoupWinner {
  return winnerOf(handTotal(coup.player), handTotal(coup.banker));
}

function winnerOf(player: number, banker: number): CoupWinner {
  if (player > banker) return 'player';
  if (banker > player) return 'banker';
  return 'tie';
}

/** Chance of each point value, 0-9, for one card from an infinite shoe. */
const ONE_CARD = Array.from(
  { length: 10 },
  (_, points) => RANKS.filter((rank) => rankPoints(rank) === points).length / RANKS.length,
);

/** Chance of each two-card total. */
const TWO_CARDS = ONE_CARD.map((_, total) =>
  ONE_CARD.reduce(
    (sum, chance, first) => sum + chance * (ONE_CARD[(total - first + 10) % 10] ?? 0),
    0,
  ),
);

/**
 * Exact chance of each winner from an infinite shoe. It walks every branch `dealCoup` can
 * take, so keep the two in step; draws only depend on totals and the player's third card,
 * which keeps it to 10^4 paths.
 */
export function coupOdds(): Readonly<Record<CoupWinner, number>> {
  const odds: Record<CoupWinner, number> = { player: 0, banker: 0, tie: 0 };
  const bankerTurn = (player: number, banker: number, third: number | null, chance: number) => {
    if (!bankerDraws(banker, third)) {
      odds[winnerOf(player, banker)] += chance;
      return;
    }
    for (const [card, cardChance] of ONE_CARD.entries()) {
      odds[winnerOf(player, (banker + card) % 10)] += chance * cardChance;
    }
  };
  for (const [player, playerChance] of TWO_CARDS.entries()) {
    for (const [banker, bankerChance] of TWO_CARDS.entries()) {
      const chance = playerChance * bankerChance;
      if (player >= 8 || banker >= 8) {
        odds[winnerOf(player, banker)] += chance;
      } else if (!playerDraws(player)) {
        bankerTurn(player, banker, null, chance);
      } else {
        for (const [card, cardChance] of ONE_CARD.entries()) {
          bankerTurn((player + card) % 10, banker, card, chance * cardChance);
        }
      }
    }
  }
  return odds;
}

import type { ItemDefinition } from './ItemDefinition.ts';

/** Everything the shop sells. Add an item by adding an entry. */
export const ITEM_DEFINITIONS: readonly ItemDefinition[] = [
  {
    id: 'lucky-coin',
    name: 'Lucky Coin',
    description: 'Losing slot spins get a small chance of a free re-spin.',
    gameId: 'slots',
    price: 40,
    boost: 0.05,
    uses: 10,
  },
  {
    id: 'golden-lever',
    name: 'Golden Lever',
    description: 'A stronger, shorter-lived Lucky Coin.',
    gameId: 'slots',
    price: 70,
    boost: 0.1,
    uses: 5,
  },
  {
    id: 'four-leaf-clover',
    name: 'Four-Leaf Clover',
    description: 'Losing roulette spins get a chance to spin again.',
    gameId: 'roulette',
    price: 60,
    boost: 0.06,
    uses: 8,
  },
  {
    id: 'rabbit-foot',
    name: "Rabbit's Foot",
    description: 'A weaker clover that lasts longer.',
    gameId: 'roulette',
    price: 45,
    boost: 0.04,
    uses: 12,
  },
  {
    id: 'ace-up-sleeve',
    name: 'Ace Up the Sleeve',
    description: 'A blackjack hit that would bust you may be redrawn.',
    gameId: 'blackjack',
    price: 80,
    boost: 0.08,
    uses: 6,
  },
];

import { describe, expect, it } from 'vitest';
import { createDefaultGameRegistry } from '../src/games/defaultGames.ts';
import { Inventory, type OwnedItem } from '../src/items/Inventory.ts';
import { ItemCatalog } from '../src/items/ItemCatalog.ts';
import { MAX_ODDS_BOOST } from '../src/items/ItemDefinition.ts';
import { ITEM_DEFINITIONS } from '../src/items/itemDefinitions.ts';

const games = createDefaultGameRegistry();

describe('item catalog', () => {
  it('ships 3-5 items, each for a registered game and under the boost cap', () => {
    const items = new ItemCatalog(ITEM_DEFINITIONS, games).all();
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.length).toBeLessThanOrEqual(5);
    for (const item of items) expect(item.boost).toBeLessThanOrEqual(MAX_ODDS_BOOST);
  });

  it('rejects items that break the rules', () => {
    const base = { id: 'x', name: 'X', description: '', gameId: 'slots', price: 10, uses: 1 };
    expect(() => new ItemCatalog([{ ...base, boost: 0.5 }], games)).toThrow(/boost/);
    expect(() => new ItemCatalog([{ ...base, boost: 0.05, gameId: 'poker' }], games)).toThrow(
      /unknown game/,
    );
  });
});

describe('inventory', () => {
  const coin = (instanceId: string, usesLeft = 2): OwnedItem => ({
    instanceId,
    itemId: 'lucky-coin',
    gameId: 'slots',
    usesLeft,
  });

  it('activates the first item per game and toggles between items', () => {
    const inventory = new Inventory();
    inventory.add(coin('a'));
    inventory.add(coin('b'));
    expect(inventory.activeFor('slots')?.instanceId).toBe('a');
    expect(inventory.toggle('b')).toBe(true);
    expect(inventory.activeFor('slots')?.instanceId).toBe('b');
    inventory.toggle('b');
    expect(inventory.activeFor('slots')).toBeUndefined();
    expect(inventory.toggle('missing')).toBe(false);
  });

  it('spends uses and hands over to the next item when one runs out', () => {
    const inventory = new Inventory();
    inventory.add(coin('a', 1));
    inventory.add(coin('b', 3));
    expect(inventory.consumeUse('a')).toBe(0);
    expect(inventory.items().map((item) => item.instanceId)).toEqual(['b']);
    expect(inventory.activeFor('slots')?.instanceId).toBe('b');
    expect(inventory.consumeUse('b')).toBe(2);
  });
});

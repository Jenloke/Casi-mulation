import type { EventRecorder } from '../events/EventRecorder.ts';
import type { FloorMap } from '../floor/FloorMap.ts';
import type { IdGenerator } from '../ids/IdGenerator.ts';
import type { ItemCatalog } from '../items/ItemCatalog.ts';
import type { Player } from '../players/Player.ts';
import { type CommandResult, OK, rejected } from './CommandResult.ts';

export interface ShopServiceDeps {
  readonly floor: FloorMap;
  readonly catalog: ItemCatalog;
  readonly recorder: EventRecorder;
  readonly ids: IdGenerator;
}

/** The shop counter: sells items for chips and lets players switch items on and off. */
export class ShopService {
  private readonly deps: ShopServiceDeps;

  constructor(deps: ShopServiceDeps) {
    this.deps = deps;
  }

  buy(player: Player, itemId: string): CommandResult {
    if (!this.deps.floor.isShop(player.pos) || player.isMoving) {
      return rejected('Walk up to the shop counter first');
    }
    const item = this.deps.catalog.get(itemId);
    if (!item) return rejected('The shop does not sell that');
    if (!player.canAfford(item.price)) return rejected('Not enough chips');
    player.debit(item.price);
    player.inventory.add({
      instanceId: this.deps.ids.next('item'),
      itemId: item.id,
      gameId: item.gameId,
      usesLeft: item.uses,
    });
    this.deps.recorder.record(player, {
      type: 'ItemPurchased',
      itemId: item.id,
      price: item.price,
    });
    return OK;
  }

  toggle(player: Player, instanceId: string): CommandResult {
    return player.inventory.toggle(instanceId) ? OK : rejected('You do not own that item');
  }
}

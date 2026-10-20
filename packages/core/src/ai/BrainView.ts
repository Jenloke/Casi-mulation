import type { PlayerId } from '@casino/contracts';
import type { FloorMap, Seat, Table } from '../floor/FloorMap.ts';
import type { CasinoGame } from '../games/CasinoGame.ts';
import type { GameRegistry } from '../games/GameRegistry.ts';
import type { ItemCatalog } from '../items/ItemCatalog.ts';
import type { Player } from '../players/Player.ts';

/** What a brain may look at while deciding. It changes the world only through commands. */
export interface BrainView {
  readonly tick: number;
  readonly floor: FloorMap;
  readonly games: GameRegistry;
  readonly catalog: ItemCatalog;
  availableSeats(table: Table, playerId: PlayerId): readonly Seat[];
  gameAt(player: Player): CasinoGame | undefined;
}

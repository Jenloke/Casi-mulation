import type { FloorDto, GameId, GridPos, PlayerDto, TableDto, TileKind } from '@casino/contracts';

/** First tile of a kind, e.g. the shop counter, as a click target. */
export function firstTileOfKind(floor: FloorDto, kind: TileKind): GridPos | null {
  const index = floor.tiles.indexOf(kind);
  return index < 0 ? null : { x: index % floor.width, y: Math.floor(index / floor.width) };
}

/** The table of a game with the most empty seats; the server still picks the actual seat. */
export function roomiestTable(
  floor: FloorDto,
  gameId: GameId,
  players: readonly PlayerDto[],
): TableDto | null {
  const taken = new Set(players.map((player) => player.seatId));
  let best: TableDto | null = null;
  let bestFree = -1;
  for (const table of floor.tables) {
    if (table.gameId !== gameId) continue;
    const free = table.seats.filter((seat) => !taken.has(seat.id)).length;
    if (free > bestFree) {
      best = table;
      bestFree = free;
    }
  }
  return best;
}

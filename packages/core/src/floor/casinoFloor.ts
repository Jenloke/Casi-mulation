import type { FloorDefinition } from './FloorMapParser.ts';

/**
 * The casino floor. Edit the drawing to rearrange it.
 *
 *   #  wall          .  floor        E  entrance
 *   $  shop counter  c  shop tile    o  seat
 *   S  slot machine  R  roulette     B  blackjack   P  baccarat (punto banco)
 *   (a connected run of one letter = one table)
 */
export const CASINO_FLOOR: FloorDefinition = {
  tableGlyphs: { S: 'slots', R: 'roulette', B: 'blackjack', P: 'baccarat' },
  rows: [
    '##############################',
    '#............................#',
    '#..$$$$$.....................#',
    '#..ccccc.....................#',
    '#............................#',
    '#........o.o.o.o...o.o.o.o...#',
    '#........S.S.S.S...S.S.S.S...#',
    '#............................#',
    '#............................#',
    '#.......ooo..oooo..ooo.......#',
    '#.......RRR..PPPP..BBB.......#',
    '#.......ooo..oooo..ooo.......#',
    '#............................#',
    '#.......ooo..oooo..ooo.......#',
    '#.......BBB..PPPP..RRR.......#',
    '#.......ooo..oooo..ooo.......#',
    '#............................#',
    '#............................#',
    '##############EE##############',
  ],
};

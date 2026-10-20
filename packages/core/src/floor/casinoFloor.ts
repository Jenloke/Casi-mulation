import type { FloorDefinition } from './FloorMapParser.ts';

/**
 * The casino floor. Edit the drawing to rearrange it.
 *
 *   #  wall          .  floor        E  entrance
 *   $  shop counter  c  shop tile    o  seat
 *   S  slot machine  R  roulette     B  blackjack   (a connected run of one letter = one table)
 */
export const CASINO_FLOOR: FloorDefinition = {
  tableGlyphs: { S: 'slots', R: 'roulette', B: 'blackjack' },
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
    '#.......ooo........ooo.......#',
    '#.......RRR........BBB.......#',
    '#.......ooo........ooo.......#',
    '#............................#',
    '#.......ooo........ooo.......#',
    '#.......BBB........RRR.......#',
    '#.......ooo........ooo.......#',
    '#............................#',
    '#............................#',
    '##############EE##############',
  ],
};

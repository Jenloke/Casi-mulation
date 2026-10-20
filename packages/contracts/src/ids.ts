/** Identifies a casino game, e.g. 'slots'. A plain string so adding a game needs no contract change. */
export type GameId = string;
export type PlayerId = string;
export type PlayerKind = 'human' | 'bot';

/** Simulation speeds a guest can ask for while auto-playing. */
export const SIM_SPEEDS = [1, 2, 4] as const;
export type SimSpeed = (typeof SIM_SPEEDS)[number];

import { DEFAULT_CHARACTER_PROFILE } from '../players/CharacterProfile.ts';
import type { Personality } from './Personality.ts';

/** Bot personalities; arriving bots cycle through them. */
export const PERSONALITIES: readonly Personality[] = [
  {
    id: 'cautious',
    label: 'Cautious',
    gameWeights: { blackjack: 5, roulette: 2, slots: 1 },
    betFraction: 0.02,
    roundsPerVisit: [4, 8],
    thinkTicks: [8, 16],
    shopChance: 0.05,
    strollChance: 0.25,
    startingChips: 1000,
    appearance: { bodyColor: '#5cb85c', outlineColor: '#1d3b1d', shape: 'square' },
  },
  {
    id: 'high-roller',
    label: 'High roller',
    gameWeights: { baccarat: 5, roulette: 4, blackjack: 3, slots: 1 },
    betFraction: 0.1,
    roundsPerVisit: [3, 6],
    thinkTicks: [4, 10],
    shopChance: 0.2,
    strollChance: 0.05,
    startingChips: 2500,
    appearance: { bodyColor: '#f0c419', outlineColor: '#5a4500', shape: 'diamond' },
  },
  {
    id: 'slot-fan',
    label: 'Slot fan',
    gameWeights: { slots: 6, roulette: 1, blackjack: 1 },
    betFraction: 0.03,
    roundsPerVisit: [8, 15],
    thinkTicks: [3, 8],
    shopChance: 0.25,
    strollChance: 0.1,
    startingChips: 800,
    appearance: { bodyColor: '#ff6fb5', outlineColor: '#5a1a3c', shape: 'circle' },
  },
  {
    id: 'wanderer',
    label: 'Wanderer',
    gameWeights: {},
    betFraction: 0.05,
    roundsPerVisit: [1, 4],
    thinkTicks: [6, 14],
    shopChance: 0.1,
    strollChance: 0.5,
    startingChips: 1000,
    appearance: { bodyColor: '#a78bfa', outlineColor: '#2e1f5e', shape: 'circle' },
  },
];

/** What a guest's character plays like with auto-play switched on. */
export const AUTO_PLAY_PERSONALITY: Personality = {
  id: 'balanced',
  label: 'Balanced',
  gameWeights: {},
  betFraction: 0.04,
  roundsPerVisit: [4, 8],
  thinkTicks: [4, 10],
  shopChance: 0.15,
  strollChance: 0.1,
  startingChips: 1000,
  appearance: DEFAULT_CHARACTER_PROFILE.appearance,
};

import type { AppearanceDto } from '@casino/contracts';

/** How a character looks. Same shape as the wire DTO so it can be sent as-is. */
export type CharacterAppearance = AppearanceDto;

/**
 * Who a character is. Everyone starts from DEFAULT_CHARACTER_PROFILE today; a character
 * creator only needs to produce one of these.
 */
export interface CharacterProfile {
  readonly name: string;
  readonly appearance: CharacterAppearance;
}

export const DEFAULT_CHARACTER_PROFILE: CharacterProfile = {
  name: 'Guest',
  appearance: { bodyColor: '#4f8cff', outlineColor: '#ffffff', shape: 'circle' },
};

export interface CharacterProfileOverrides {
  readonly name?: string;
  readonly appearance?: Partial<CharacterAppearance>;
}

export function createCharacterProfile(
  overrides: CharacterProfileOverrides = {},
): CharacterProfile {
  return {
    name: overrides.name ?? DEFAULT_CHARACTER_PROFILE.name,
    appearance: { ...DEFAULT_CHARACTER_PROFILE.appearance, ...overrides.appearance },
  };
}

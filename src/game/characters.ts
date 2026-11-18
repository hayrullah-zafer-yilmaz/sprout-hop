export type CharacterId = 'sprout' | 'zip' | 'bun'

export const CHARACTER_IDS: CharacterId[] = ['sprout', 'zip', 'bun']

export interface Moveset {
  walkSpeed: number
  runSpeed: number
  acceleration: number
  jumpVelocity: number
  fallGravity: number
  glideSpeed: number | null
}

export interface Character {
  name: string
  moves: Moveset
  rating: { speed: number; jump: number }
}

export const CHARACTERS: Record<CharacterId, Character> = {
  sprout: {
    name: 'Sprout',
    moves: { walkSpeed: 6.5, runSpeed: 10, acceleration: 55, jumpVelocity: 20.5, fallGravity: 64, glideSpeed: null },
    rating: { speed: 2, jump: 2 },
  },
  zip: {
    name: 'Zip',
    moves: { walkSpeed: 7.6, runSpeed: 11.6, acceleration: 68, jumpVelocity: 20.2, fallGravity: 64, glideSpeed: null },
    rating: { speed: 3, jump: 1 },
  },
  bun: {
    name: 'Bun',
    moves: { walkSpeed: 5.8, runSpeed: 9, acceleration: 48, jumpVelocity: 21.5, fallGravity: 56, glideSpeed: 3.5 },
    rating: { speed: 1, jump: 3 },
  },
}

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && (CHARACTER_IDS as string[]).includes(value)
}

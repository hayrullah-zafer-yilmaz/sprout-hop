import type { CharacterId } from '../game/characters'

export const HERO = { radius: 0.42, center: 0.5 }

export interface HeroLook {
  body: string
  limbs: string
  feet: string
}

export const HERO_LOOKS: Record<CharacterId, HeroLook> = {
  sprout: { body: '#ffa046', limbs: '#f58a2c', feet: '#6b3f22' },
  zip: { body: '#ffd84d', limbs: '#f2c12e', feet: '#e5484d' },
  bun: { body: '#fff1e2', limbs: '#f6e3cf', feet: '#f59fbd' },
}

export function strideOf(vx: number): number {
  return Math.min(Math.abs(vx) / 6, 1)
}

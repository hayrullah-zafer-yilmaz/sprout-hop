import type { CharacterId } from '../game/characters'

export const HERO = { radius: 0.43, center: 0.43 }

const STRETCH = 0.94
const PEAR = 0.06

export const POT = {
  base: 0.08,
  neck: 0.64,
  collar: { bottom: 0.6, top: 0.8, radius: 0.47, lip: 0.38, round: 0.03 },
  soil: { y: 0.77, height: 0.24 },
}

export const SOIL_TOP = POT.soil.y + POT.collar.lip * POT.soil.height

export const FACE = { width: 0.86, height: 0.54, y: -0.036 }

export interface ShoeLook {
  upper: string
  sole: string
  accent: string
  zone: 'toe' | 'cuff'
}

export interface HeroLook {
  body: string
  collar: string
  soil: string
  limbs: string
  shade: string
  rim: string
  ink: string
  iris: [string, string]
  blush: string
  roughness: number
  shoe: ShoeLook
}

export const HERO_LOOKS: Record<CharacterId, HeroLook> = {
  sprout: {
    body: '#ee8240',
    collar: '#f59d5c',
    soil: '#6b4328',
    limbs: '#e8763a',
    shade: '#8a3612',
    rim: '#ffe2c4',
    ink: '#3a1708',
    iris: ['#8f5a36', '#140904'],
    blush: '#ff6f7d',
    roughness: 0.62,
    shoe: { upper: '#e8763a', sole: '#b9561f', accent: '#f59d5c', zone: 'cuff' },
  },
  zip: {
    body: '#ffd43b',
    collar: '#f7a823',
    soil: '#6b4328',
    limbs: '#ffc21f',
    shade: '#a86d05',
    rim: '#fff6c9',
    ink: '#3f2b06',
    iris: ['#5aa9f0', '#0c2350'],
    blush: '#ff8a4c',
    roughness: 0.38,
    shoe: { upper: '#f03e3e', sole: '#ffffff', accent: '#ffffff', zone: 'toe' },
  },
  bun: {
    body: '#fff5ea',
    collar: '#ffb3c8',
    soil: '#6b4328',
    limbs: '#fbe8d6',
    shade: '#b08877',
    rim: '#ffffff',
    ink: '#5b2c40',
    iris: ['#b48cf0', '#2e1458'],
    blush: '#ff97b5',
    roughness: 0.4,
    shoe: { upper: '#fff1e2', sole: '#ffb3c8', accent: '#ffffff', zone: 'cuff' },
  },
}

function angleAt(y: number): number {
  return Math.acos(Math.max(-1, Math.min(1, (HERO.center - y) / (HERO.radius * STRETCH))))
}

export const BELLY = { from: angleAt(POT.base), to: angleAt(POT.neck) }

export function bodyPoint(t: number): { r: number; y: number } {
  return {
    r: HERO.radius * Math.sin(t) * (1 + PEAR * Math.cos(t)),
    y: HERO.center - HERO.radius * STRETCH * Math.cos(t),
  }
}

export function bodyRadiusAt(y: number): number {
  const c = (HERO.center - y) / (HERO.radius * STRETCH)
  if (c <= -1 || c >= 1) return 0
  return bodyPoint(Math.acos(c)).r
}

export function strideOf(vx: number): number {
  return Math.min(Math.abs(vx) / 6, 1)
}

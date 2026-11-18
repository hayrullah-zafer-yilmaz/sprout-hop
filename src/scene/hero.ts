import type { CharacterId } from '../game/characters'

export const HERO = { radius: 0.42, center: 0.5 }

const STRETCH = 0.98
const PEAR = 0.09

export const BODY_TOP = HERO.center + HERO.radius * STRETCH

export const FACE = { width: 0.86, height: 0.54, y: 0.02 }

export interface ShoeLook {
  upper: string
  sole: string
  accent: string
  zone: 'toe' | 'cuff'
}

export interface HeroLook {
  body: string
  limbs: string
  shade: string
  rim: string
  ink: string
  iris: [string, string]
  blush: string
  shoe: ShoeLook
}

export const HERO_LOOKS: Record<CharacterId, HeroLook> = {
  sprout: {
    body: '#ff9433',
    limbs: '#ff8424',
    shade: '#9c3f12',
    rim: '#ffe2b8',
    ink: '#4a200c',
    iris: ['#e0913f', '#5c2a0c'],
    blush: '#ff5f78',
    shoe: { upper: '#8a5330', sole: '#f6dcb4', accent: '#5e331b', zone: 'cuff' },
  },
  zip: {
    body: '#ffd43b',
    limbs: '#ffc21f',
    shade: '#a86d05',
    rim: '#fff6c9',
    ink: '#3f2b06',
    iris: ['#5cb8ff', '#123d8a'],
    blush: '#ff8a4c',
    shoe: { upper: '#f03e3e', sole: '#ffffff', accent: '#ffffff', zone: 'toe' },
  },
  bun: {
    body: '#fff5ea',
    limbs: '#fbe8d6',
    shade: '#b08877',
    rim: '#ffffff',
    ink: '#5b2c40',
    iris: ['#c7a0ff', '#4c2488'],
    blush: '#ff97b5',
    shoe: { upper: '#ff9fc0', sole: '#ffd9e6', accent: '#ffffff', zone: 'cuff' },
  },
}

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

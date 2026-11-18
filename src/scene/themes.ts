import type { LevelId } from '../game/levels'
import type { TilePalette } from './textures'

export interface DecorPalette {
  bush: string
  stem: string
  tuft: string
  rock: string
  petals: string[]
}

export interface Theme {
  backdrop: 'meadow' | 'falls'
  seeds: { decor: number; backdrop: number }
  sky: [string, string, string]
  fog: { color: string; near: number; far: number }
  hemisphere: { sky: string; ground: string; intensity: number }
  sun: { color: string; intensity: number }
  tiles: TilePalette
  decor: DecorPalette
}

export const THEMES: Record<LevelId, Theme> = {
  meadow: {
    backdrop: 'meadow',
    seeds: { decor: 2026, backdrop: 77 },
    sky: ['#3f8fe0', '#8cc8ff', '#dff1ff'],
    fog: { color: '#d6ecff', near: 45, far: 210 },
    hemisphere: { sky: '#e3f2ff', ground: '#5b7a3c', intensity: 1.5 },
    sun: { color: '#fff0d4', intensity: 2.4 },
    tiles: {
      grass: '#5bbf4f',
      grassSpeckles: ['#4caa42', '#74d265', '#66c95a', '#8ee07f'],
      grassEdge: '#3f9a38',
      grassHighlight: '#8ee07f',
      dirt: '#8b5a3c',
      dirtSpeckles: ['#74482d', '#9d6a46', '#7d5034'],
      pebble: '#b98a64',
      pebbleShade: '#6b4229',
      stone: '#a3acb6',
      stoneSpeckles: ['#949ea9', '#b3bbc4', '#8b95a0'],
      stoneLight: '#cbd2d9',
      stoneDark: '#6f7882',
      stoneSeam: '#8f99a4',
      stoneSeamLight: '#bcc4cc',
    },
    decor: {
      bush: '#3f9f46',
      stem: '#3b8d3a',
      tuft: '#4caf45',
      rock: '#9aa3ad',
      petals: ['#ffd23f', '#ff6b8b', '#ffffff', '#9b7bff', '#ff9f43'],
    },
  },
  falls: {
    backdrop: 'falls',
    seeds: { decor: 1907, backdrop: 4242 },
    sky: ['#4f97c4', '#9dcde3', '#e2f2f5'],
    fog: { color: '#d3e7ec', near: 32, far: 175 },
    hemisphere: { sky: '#e2f3f7', ground: '#3e6b56', intensity: 1.45 },
    sun: { color: '#fff4e2', intensity: 2.2 },
    tiles: {
      grass: '#4e9f5e',
      grassSpeckles: ['#3f8c51', '#5fb36d', '#6fc27a', '#8dd394'],
      grassEdge: '#357a46',
      grassHighlight: '#a3e0a8',
      dirt: '#6e665d',
      dirtSpeckles: ['#5d564e', '#7f776c', '#655e55'],
      pebble: '#9b9388',
      pebbleShade: '#4f4943',
      stone: '#86979f',
      stoneSpeckles: ['#7a8b94', '#94a4ac', '#73848d'],
      stoneLight: '#b5c3ca',
      stoneDark: '#5b6a72',
      stoneSeam: '#73848d',
      stoneSeamLight: '#a8b6bd',
    },
    decor: {
      bush: '#2f8f5b',
      stem: '#2e7d4f',
      tuft: '#3a9d5d',
      rock: '#7d8f8a',
      petals: ['#a5d8ff', '#ffffff', '#b197fc', '#ffe066', '#74c0fc'],
    },
  },
}

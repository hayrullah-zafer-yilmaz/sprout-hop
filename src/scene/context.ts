import { inject, type InjectionKey } from 'vue'
import type { World } from '../game/world'
import type { Theme } from './themes'

export const WORLD_KEY: InjectionKey<World> = Symbol('world')
export const THEME_KEY: InjectionKey<Theme> = Symbol('theme')

export const PRIORITY = {
  world: -10,
  models: 0,
  camera: 10,
  backdrop: 20,
} as const

export function useWorld(): World {
  const world = inject(WORLD_KEY)
  if (!world) throw new Error('useWorld() must be called inside LevelScene')
  return world
}

export function useTheme(): Theme {
  const theme = inject(THEME_KEY)
  if (!theme) throw new Error('useTheme() must be called inside LevelScene')
  return theme
}

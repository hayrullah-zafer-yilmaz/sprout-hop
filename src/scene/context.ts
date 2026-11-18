import { inject, type InjectionKey } from 'vue'
import type { World } from '../game/world'

export const WORLD_KEY: InjectionKey<World> = Symbol('world')

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

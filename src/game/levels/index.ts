import { parseLevel, type LevelData } from '../level'
import { FALLS } from './falls'
import { MEADOW } from './meadow'

export type LevelId = 'meadow' | 'falls'

export const LEVEL_IDS: LevelId[] = ['meadow', 'falls']

const ROWS: Record<LevelId, string[]> = {
  meadow: MEADOW,
  falls: FALLS,
}

const parsed = new Map<LevelId, LevelData>()

export function loadLevel(id: LevelId): LevelData {
  let level = parsed.get(id)
  if (!level) {
    level = parseLevel(ROWS[id])
    parsed.set(id, level)
  }
  return level
}

export function levelNumber(id: LevelId): number {
  return LEVEL_IDS.indexOf(id) + 1
}

export function nextLevel(id: LevelId): LevelId | null {
  return LEVEL_IDS[LEVEL_IDS.indexOf(id) + 1] ?? null
}

export function isLevelId(value: unknown): value is LevelId {
  return typeof value === 'string' && (LEVEL_IDS as string[]).includes(value)
}

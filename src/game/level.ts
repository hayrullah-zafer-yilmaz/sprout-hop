export const Tile = {
  Empty: 0,
  Ground: 1,
  Stone: 2,
  Brick: 3,
  Crate: 4,
  LifeCrate: 5,
  Used: 6,
  Plank: 7,
} as const

export type TileId = (typeof Tile)[keyof typeof Tile]

export type EnemyKind = 'slug' | 'burr'

export interface Spawn {
  x: number
  y: number
}

export interface EnemySpawn extends Spawn {
  kind: EnemyKind
}

export interface MoverSpawn extends Spawn {
  axis: 'x' | 'y'
  min: number
  max: number
}

export interface LevelData {
  width: number
  height: number
  tiles: Uint8Array
  start: Spawn
  coins: Spawn[]
  enemies: EnemySpawn[]
  spikes: Spawn[]
  movers: MoverSpawn[]
  rocks: Spawn[]
  checkpoints: Spawn[]
  goal: Spawn
}

export function tileAt(level: LevelData, x: number, y: number): TileId {
  if (x < 0 || x >= level.width || y < 0 || y >= level.height) return Tile.Empty
  return level.tiles[y * level.width + x] as TileId
}

const tileChars: Record<string, TileId> = {
  '#': Tile.Ground,
  X: Tile.Stone,
  B: Tile.Brick,
  C: Tile.Crate,
  L: Tile.LifeCrate,
  U: Tile.Used,
  '-': Tile.Plank,
}

export function parseLevel(rows: string[]): LevelData {
  const height = rows.length
  const width = Math.max(...rows.map((row) => row.length))
  const tiles = new Uint8Array(width * height)
  const coins: Spawn[] = []
  const enemies: EnemySpawn[] = []
  const spikes: Spawn[] = []
  const rocks: Spawn[] = []
  const checkpoints: Spawn[] = []
  const moverStarts: { x: number; y: number; axis: 'x' | 'y' }[] = []
  const moverEnds: { x: number; y: number; axis: 'x' | 'y' }[] = []
  let start: Spawn | null = null
  let goal: Spawn | null = null

  for (let r = 0; r < height; r++) {
    const row = rows[r]
    const y = height - 1 - r
    for (let x = 0; x < row.length; x++) {
      const char = row[x]
      const tile = tileChars[char]
      if (tile !== undefined) {
        tiles[y * width + x] = tile
        continue
      }
      switch (char) {
        case 'o':
          coins.push({ x, y })
          break
        case 's':
          enemies.push({ x, y, kind: 'slug' })
          break
        case 'k':
          enemies.push({ x, y, kind: 'burr' })
          break
        case '^':
          spikes.push({ x, y })
          break
        case 'r':
          rocks.push({ x, y })
          break
        case 'K':
          checkpoints.push({ x, y })
          break
        case 'P':
          start = { x, y }
          break
        case 'F':
          goal = { x, y }
          break
        case 'm':
          moverStarts.push({ x, y, axis: 'x' })
          break
        case 'M':
          moverEnds.push({ x, y, axis: 'x' })
          break
        case 'v':
          moverStarts.push({ x, y, axis: 'y' })
          break
        case 'V':
          moverEnds.push({ x, y, axis: 'y' })
          break
        case ' ':
          break
        default:
          throw new Error(`Unknown level character "${char}" at ${x},${y}`)
      }
    }
  }

  if (!start) throw new Error('Level has no player start (P)')
  if (!goal) throw new Error('Level has no goal (F)')

  const movers = moverStarts.map((from) => {
    const to = moverEnds.find((end) =>
      end.axis === from.axis && (from.axis === 'x' ? end.y === from.y : end.x === from.x),
    )
    if (!to) throw new Error(`Moving platform at ${from.x},${from.y} has no end marker`)
    return from.axis === 'x'
      ? { x: from.x, y: from.y, axis: 'x' as const, min: from.x, max: to.x }
      : { x: from.x, y: from.y, axis: 'y' as const, min: from.y, max: to.y }
  })

  rocks.sort((a, b) => a.x - b.x)
  return { width, height, tiles, start, coins, enemies, spikes, movers, rocks, checkpoints, goal }
}

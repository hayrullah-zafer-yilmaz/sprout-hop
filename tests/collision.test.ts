import { describe, expect, it } from 'vitest'
import { moveX, moveY, overlaps, type Body, type TileLookup } from '../src/game/collision'
import { Tile, type TileId } from '../src/game/level'

const TILES: Record<string, TileId> = { '#': Tile.Ground, '-': Tile.Plank }

function grid(rows: string[]): TileLookup {
  return (x, y) => TILES[rows[rows.length - 1 - y]?.[x] ?? ' '] ?? Tile.Empty
}

function body(x: number, y: number): Body {
  return { x, y, w: 0.8, h: 0.9, vx: 0, vy: 0, onGround: false }
}

describe('collision', () => {
  it('detects overlapping boxes but not touching ones', () => {
    expect(overlaps({ x: 0, y: 0, w: 1, h: 1 }, { x: 0.5, y: 0.5, w: 1, h: 1 })).toBe(true)
    expect(overlaps({ x: 0, y: 0, w: 1, h: 1 }, { x: 1, y: 0, w: 1, h: 1 })).toBe(false)
  })

  it('stops a body at the face of a wall', () => {
    const tiles = grid(['   #', '####'])
    const mover = body(1.5, 1)
    expect(moveX(tiles, mover, 1)).toBe(true)
    expect(mover.x + mover.w).toBeCloseTo(3, 6)
  })

  it('lands on a plank only when coming from above', () => {
    const tiles = grid(['--', '  '])
    const falling = body(0.1, 2.05)
    expect(moveY(tiles, falling, -0.1, 2.05).landed).toBe(true)
    expect(falling.y).toBe(2)
    const passingThrough = body(0.1, 1.5)
    expect(moveY(tiles, passingThrough, -0.1, 1.5).landed).toBe(false)
  })

  it('reports the ceiling tile closest to the body center', () => {
    const tiles = grid(['##', '  ', '  '])
    const jumper = body(0.8, 1)
    const hit = moveY(tiles, jumper, 0.3, 1)
    expect(hit.ceiling).toEqual({ x: 1, y: 2 })
    expect(jumper.y + jumper.h).toBeCloseTo(2, 6)
  })
})

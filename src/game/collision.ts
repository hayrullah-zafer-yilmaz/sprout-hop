import { Tile, type TileId } from './level'

export interface Point {
  x: number
  y: number
}

export interface Box extends Point {
  w: number
  h: number
}

export interface Body extends Box {
  vx: number
  vy: number
  onGround: boolean
}

export type TileLookup = (x: number, y: number) => TileId

export interface VerticalHit {
  landed: boolean
  ceiling: Point | null
}

export const ONE_WAY_TOLERANCE = 0.05

const EPS = 0.001
const NO_HIT: Readonly<VerticalHit> = Object.freeze({ landed: false, ceiling: null })
const LANDED: Readonly<VerticalHit> = Object.freeze({ landed: true, ceiling: null })

export function isSolid(tile: TileId): boolean {
  return tile !== Tile.Empty && tile !== Tile.Plank
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function moveX(tiles: TileLookup, body: Body, dx: number): boolean {
  if (dx === 0) return false
  body.x += dx
  const column = dx > 0 ? Math.floor(body.x + body.w - EPS) : Math.floor(body.x + EPS)
  const bottom = Math.floor(body.y + EPS)
  const top = Math.floor(body.y + body.h - EPS)
  for (let row = bottom; row <= top; row++) {
    if (!isSolid(tiles(column, row))) continue
    body.x = dx > 0 ? column - body.w : column + 1
    body.vx = 0
    return true
  }
  return false
}

export function moveY(tiles: TileLookup, body: Body, dy: number, prevBottom: number): Readonly<VerticalHit> {
  body.y += dy
  if (dy < 0) return land(tiles, body, prevBottom)
  if (dy > 0) return bumpHead(tiles, body)
  return NO_HIT
}

function land(tiles: TileLookup, body: Body, prevBottom: number): Readonly<VerticalHit> {
  const row = Math.floor(body.y)
  const top = row + 1
  const left = Math.floor(body.x + EPS)
  const right = Math.floor(body.x + body.w - EPS)
  const fromAbove = prevBottom >= top - ONE_WAY_TOLERANCE
  for (let column = left; column <= right; column++) {
    const tile = tiles(column, row)
    if (isSolid(tile) || (tile === Tile.Plank && fromAbove)) {
      body.y = top
      body.vy = 0
      return LANDED
    }
  }
  return NO_HIT
}

function bumpHead(tiles: TileLookup, body: Body): Readonly<VerticalHit> {
  const row = Math.floor(body.y + body.h - EPS)
  const left = Math.floor(body.x + EPS)
  const right = Math.floor(body.x + body.w - EPS)
  const center = body.x + body.w / 2
  let ceiling: Point | null = null
  let closest = Infinity
  for (let column = left; column <= right; column++) {
    if (!isSolid(tiles(column, row))) continue
    const distance = Math.abs(column + 0.5 - center)
    if (distance < closest) {
      closest = distance
      ceiling = { x: column, y: row }
    }
  }
  if (!ceiling) return NO_HIT
  body.y = row - body.h
  body.vy = 0
  return { landed: false, ceiling }
}

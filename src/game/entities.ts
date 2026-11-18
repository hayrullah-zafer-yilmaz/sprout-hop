import { SIZES } from './config'
import type { Body, Box, Point } from './collision'
import type { EnemyKind, EnemySpawn, MoverSpawn, Spawn } from './level'

export interface InputState {
  axis: number
  jump: boolean
  jumpPressed: boolean
  run: boolean
}

export const NO_INPUT: Readonly<InputState> = Object.freeze({ axis: 0, jump: false, jumpPressed: false, run: false })

export type Phase = 'playing' | 'dying' | 'won' | 'complete' | 'gameover'

export type GameEvent =
  | 'jump'
  | 'coin'
  | 'stomp'
  | 'bump'
  | 'break'
  | 'life'
  | 'die'
  | 'respawn'
  | 'checkpoint'
  | 'goal'
  | 'tally'
  | 'complete'
  | 'gameover'

export interface Player extends Body {
  prevY: number
  facing: 1 | -1
  coyote: number
  jumpBuffer: number
  invulnerable: number
  dead: boolean
  deadTimer: number
  platform: Mover | null
  combo: number
  landedAt: number
}

export interface Enemy extends Body {
  kind: EnemyKind
  dir: 1 | -1
  active: boolean
  alive: boolean
  squashed: boolean
  flipped: boolean
  diedAt: number
  gone: boolean
}

export interface Coin extends Point {
  hitbox: Box
  collected: boolean
  collectedAt: number
}

export interface Mover extends Box {
  axis: 'x' | 'y'
  min: number
  max: number
  dir: 1 | -1
  wait: number
  dx: number
  dy: number
}

export interface Checkpoint extends Point {
  area: Box
  active: boolean
  activatedAt: number
}

export interface Goal extends Point {
  height: number
  reached: boolean
  reachedAt: number
  flag: number
}

export interface Pop extends Point {
  active: boolean
  kind: 'coin' | 'life'
  vy: number
  age: number
}

export interface Debris extends Point {
  active: boolean
  vx: number
  vy: number
  spin: number
  angle: number
  age: number
}

export interface Bump extends Point {
  t: number
}

export function standingSpot({ x, y }: Spawn): Point {
  return { x: x + (1 - SIZES.player.w) / 2, y }
}

export function createPlayer(spot: Point): Player {
  return {
    ...spot,
    prevY: spot.y,
    ...SIZES.player,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    coyote: 0,
    jumpBuffer: 0,
    invulnerable: 0,
    dead: false,
    deadTimer: 0,
    platform: null,
    combo: 0,
    landedAt: -1,
  }
}

export function createEnemy({ x, y, kind }: EnemySpawn): Enemy {
  const { w, h } = SIZES[kind]
  return {
    kind,
    x: x + (1 - w) / 2,
    y,
    w,
    h,
    vx: 0,
    vy: 0,
    onGround: false,
    dir: -1,
    active: false,
    alive: true,
    squashed: false,
    flipped: false,
    diedAt: 0,
    gone: false,
  }
}

export function createCoin({ x, y }: Spawn): Coin {
  return { x, y, hitbox: { x: x + 0.2, y: y + 0.15, w: 0.6, h: 0.7 }, collected: false, collectedAt: 0 }
}

export function createSpikes({ x, y }: Spawn): Box {
  return { x: x + 0.1, y, w: 0.8, h: 0.45 }
}

export function createMover({ x, y, axis, min, max }: MoverSpawn): Mover {
  const offset = 1 - SIZES.mover.h
  return {
    x,
    y: y + offset,
    ...SIZES.mover,
    axis,
    min: axis === 'x' ? min : min + offset,
    max: axis === 'x' ? max : max + offset,
    dir: 1,
    wait: 0,
    dx: 0,
    dy: 0,
  }
}

export function createCheckpoint({ x, y }: Spawn): Checkpoint {
  return { x, y, area: { x, y, w: 1, h: 2.5 }, active: false, activatedAt: 0 }
}

export function createGoal({ x, y }: Spawn): Goal {
  return { x, y, height: SIZES.goalHeight, reached: false, reachedAt: 0, flag: 0 }
}

export function createPop(): Pop {
  return { active: false, kind: 'coin', x: 0, y: 0, vy: 0, age: 0 }
}

export function createDebris(): Debris {
  return { active: false, x: 0, y: 0, vx: 0, vy: 0, spin: 0, angle: 0, age: 0 }
}

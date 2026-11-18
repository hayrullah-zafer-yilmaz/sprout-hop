import { describe, expect, it } from 'vitest'
import { CHARACTER_IDS } from '../src/game/characters'
import { isSolid } from '../src/game/collision'
import type { InputState } from '../src/game/entities'
import { Tile } from '../src/game/level'
import { LEVEL_IDS, loadLevel } from '../src/game/levels'
import { World } from '../src/game/world'

const STEP = 1 / 120

function groundAhead(world: World, x: number, y: number): boolean {
  for (let ty = Math.floor(y - 0.5); ty >= 0; ty--) {
    const tile = world.tileAt(Math.floor(x), ty)
    if (isSolid(tile) || tile === Tile.Plank) return true
  }
  return false
}

function gapWidth(world: World, from: number, y: number): number {
  let width = 0
  while (width < 16 && !groundAhead(world, from + width + 0.5, y)) width++
  return width
}

function gapWithin(world: World, from: number, distance: number, y: number): boolean {
  for (let x = from; x < from + distance; x++) if (!groundAhead(world, x + 0.5, y)) return true
  return false
}

function rockDanger(world: World): 'flee' | 'wait' | null {
  const p = world.player
  for (const rock of world.rocks) {
    if (!rock.active) continue
    const left = rock.x - 0.15
    const right = rock.x + rock.w + 0.15
    const threat = rock.state !== 'resting' || rock.timer < 1.1
    if (!threat) continue
    if (p.x + p.w > left && p.x < right) return 'flee'
    const ahead = left - (p.x + p.w)
    if (ahead > 0 && ahead < 1.3) return 'wait'
  }
  return null
}

function decide(world: World, held: { jump: number; still: number }): InputState {
  const p = world.player
  const front = p.x + p.w
  const feet = p.y
  let axis = 1
  let jump = held.jump > 0
  const danger = p.onGround ? rockDanger(world) : null

  if (danger === 'flee') {
    axis = 1
  } else if (danger === 'wait') {
    axis = 0
  } else if (p.platform && p.platform.axis === 'x') {
    const mover = p.platform
    axis = p.x + p.w < mover.x + mover.w - 0.25 ? 1 : 0
    if (mover.x >= mover.max - 0.2) {
      axis = 1
      jump = true
      held.jump = 0.3
    }
  } else if (p.onGround) {
    const wall = isSolid(world.tileAt(Math.floor(front + 0.3), Math.floor(feet + 0.1)))
    const gapStart = Math.floor(front + 0.2)
    const gap = groundAhead(world, front + 0.6, feet) ? 0 : gapWidth(world, gapStart, feet)
    const reaction = Math.max(1, Math.abs(p.vx) / 6.5)
    const nearest = world.enemies
      .filter((item) => item.alive && item.x > p.x && Math.abs(item.y - feet) < 1.5)
      .reduce<{ gap: number; reach: number } | null>((best, item) => {
        const gap = item.x - front
        const reach = (item.kind === 'burr' ? 2.4 : 1.6) * reaction
        return best && best.gap <= gap ? best : { gap, reach }
      }, null)
    const tooClose = nearest !== null && nearest.gap < 0.9
    const enemy = nearest !== null && nearest.gap < nearest.reach
    const spikes = world.spikes.some((spike) => spike.x > p.x && spike.x - front < 1.2 && Math.abs(spike.y - feet) < 0.5)

    if (gap > 6) {
      const mover = world.movers.find((item) => item.axis === 'x' && item.x > p.x - 4 && item.x < p.x + 16)
      const near = mover && mover.x - front < 1.2 && mover.wait > 0 && mover.dir === 1
      axis = 0
      if (near) {
        axis = 1
        jump = true
        held.jump = 0.35
      }
    } else if (tooClose) {
      axis = -1
    } else if (wall || gap > 0 || enemy || spikes) {
      jump = true
      held.jump = 0.5
      if (enemy && !wall && gap === 0 && gapWithin(world, Math.floor(front), 6, feet)) held.still = 0.9
    }
  } else if (p.platform === null && p.vy < 0) {
    const below = world.movers.find((item) => item.axis === 'x' && p.x + p.w > item.x && p.x < item.x + item.w)
    if (below) axis = 0
  }

  if (held.still > 0 && !p.platform) axis = 0
  return { axis, jump, jumpPressed: jump && held.jump >= 0.29 && p.onGround, run: false }
}

describe.each(LEVEL_IDS)('level %s', (levelId) => {
  it.each(CHARACTER_IDS)('can be finished by a simple bot playing %s', (character) => {
    const world = new World(loadLevel(levelId), { character })
    const held = { jump: 0, still: 0 }
    let wasJumping = false
    let seconds = 0
    while (seconds < 240 && world.phase !== 'complete' && world.phase !== 'gameover') {
      const state = world.phase === 'playing' ? decide(world, held) : { axis: 0, jump: false, jumpPressed: false, run: false }
      const pressed = state.jumpPressed && !wasJumping
      wasJumping = state.jump
      world.step(STEP, { ...state, jumpPressed: pressed })
      held.jump = Math.max(0, held.jump - STEP)
      held.still = Math.max(0, held.still - STEP)
      seconds += STEP
    }
    expect(world.phase).toBe('complete')
    expect(world.lives).toBeGreaterThan(0)
  })
})

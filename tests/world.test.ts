import { describe, expect, it } from 'vitest'
import { CHARACTERS, type CharacterId } from '../src/game/characters'
import { ROCKS, RULES } from '../src/game/config'
import { NO_INPUT, type GameEvent, type InputState } from '../src/game/entities'
import { Tile, parseLevel } from '../src/game/level'
import { LEVEL_IDS, levelNumber, loadLevel, nextLevel } from '../src/game/levels'
import { World } from '../src/game/world'

const STEP = 1 / 120

function input(partial: Partial<InputState> = {}): InputState {
  return { ...NO_INPUT, ...partial }
}

function run(world: World, seconds: number, state: InputState = NO_INPUT): void {
  const steps = Math.round(seconds / STEP)
  for (let i = 0; i < steps; i++) {
    world.step(STEP, { ...state, jumpPressed: i === 0 && state.jumpPressed })
  }
}

function level(rows: string[], character: CharacterId = 'sprout'): World {
  return new World(parseLevel(rows), { character })
}

function jumpPeak(world: World): number {
  run(world, 0.2)
  const start = world.player.y
  let peak = start
  world.step(STEP, input({ jump: true, jumpPressed: true }))
  for (let i = 0; i < 120; i++) {
    world.step(STEP, input({ jump: true }))
    peak = Math.max(peak, world.player.y)
  }
  return peak - start
}

function events(world: World): GameEvent[] {
  const list: GameEvent[] = []
  world.on((event) => list.push(event))
  return list
}

describe('parseLevel', () => {
  it('reads the first level', () => {
    const data = loadLevel('meadow')
    expect(data.width).toBe(224)
    expect(data.height).toBe(15)
    expect(data.start).toEqual({ x: 3, y: 2 })
    expect(data.goal.x).toBe(201)
    expect(data.movers).toHaveLength(2)
    expect(data.movers.map((mover) => mover.axis).sort()).toEqual(['x', 'y'])
    expect(data.checkpoints).toHaveLength(1)
    expect(data.coins.length).toBeGreaterThan(40)
    expect(data.enemies.some((enemy) => enemy.kind === 'burr')).toBe(true)
  })

  it('reads the waterfall level', () => {
    const data = loadLevel('falls')
    expect(data.height).toBe(15)
    expect(data.start).toEqual({ x: 3, y: 2 })
    expect(data.movers.map((mover) => mover.axis).sort()).toEqual(['x', 'y'])
    expect(data.checkpoints).toHaveLength(1)
    expect(data.coins.length).toBeGreaterThan(35)
    expect(data.spikes.length).toBeGreaterThan(0)
  })

  it('reads the magma level with its falling rocks', () => {
    const data = loadLevel('magma')
    expect(data.width).toBe(210)
    expect(data.start).toEqual({ x: 3, y: 2 })
    expect(data.goal).toEqual({ x: 203, y: 2 })
    expect(data.rocks).toHaveLength(11)
    expect(data.rocks.map((rock) => rock.x)).toEqual([...data.rocks.map((rock) => rock.x)].sort((a, b) => a - b))
    expect(data.checkpoints).toHaveLength(1)
  })

  it.each(LEVEL_IDS)('keeps every gap in %s at most twelve tiles wide', (id) => {
    const data = loadLevel(id)
    let gap = 0
    let widest = 0
    for (let x = 0; x < data.width; x++) {
      const tile = data.tiles[1 * data.width + x]
      const footing = tile === Tile.Ground || tile === Tile.Stone || tile === Tile.Plank
      gap = footing ? 0 : gap + 1
      widest = Math.max(widest, gap)
    }
    expect(widest).toBeLessThanOrEqual(12)
  })

  it('orders the levels and knows which one comes next', () => {
    expect(LEVEL_IDS).toEqual(['meadow', 'falls', 'magma'])
    expect(levelNumber('magma')).toBe(3)
    expect(nextLevel('meadow')).toBe('falls')
    expect(nextLevel('falls')).toBe('magma')
    expect(nextLevel('magma')).toBeNull()
  })

  it('rejects unknown characters and missing markers', () => {
    expect(() => parseLevel(['P  F', '####', '?###'])).toThrow(/Unknown level character/)
    expect(() => parseLevel(['   F', '####'])).toThrow(/player start/)
    expect(() => parseLevel(['P   ', '####'])).toThrow(/goal/)
  })
})

describe('player movement', () => {
  const flat = ['', '', '', '', '', '', 'P                  F', '####################', '####################']

  it('lands on the ground and stays there', () => {
    const world = level(flat)
    run(world, 1)
    expect(world.player.onGround).toBe(true)
    expect(world.player.y).toBeCloseTo(2, 5)
  })

  it('walks and runs to the right', () => {
    const walker = level(flat)
    const runner = level(flat)
    run(walker, 0.2)
    run(runner, 0.2)
    run(walker, 1, input({ axis: 1 }))
    run(runner, 1, input({ axis: 1, run: true }))
    expect(walker.player.vx).toBeCloseTo(CHARACTERS.sprout.moves.walkSpeed, 5)
    expect(runner.player.vx).toBeCloseTo(CHARACTERS.sprout.moves.runSpeed, 5)
    expect(runner.player.x).toBeGreaterThan(walker.player.x + 2)
  })

  it('jumps a little over four tiles when the button is held', () => {
    const world = level(flat)
    run(world, 0.2)
    let peak = world.player.y
    world.step(STEP, input({ jump: true, jumpPressed: true }))
    for (let i = 0; i < 120; i++) {
      world.step(STEP, input({ jump: true }))
      peak = Math.max(peak, world.player.y)
    }
    expect(peak - 2).toBeGreaterThan(4)
    expect(peak - 2).toBeLessThan(4.5)
  })

  it('jumps lower when the button is released early', () => {
    const world = level(flat)
    run(world, 0.2)
    let peak = world.player.y
    world.step(STEP, input({ jump: true, jumpPressed: true }))
    for (let i = 0; i < 120; i++) {
      world.step(STEP, input({ jump: i < 6 }))
      peak = Math.max(peak, world.player.y)
    }
    expect(peak - 2).toBeLessThan(2.5)
  })

  it('stops at walls', () => {
    const world = level(['', '', '', '', '', 'P    X        F', '###############', '###############'])
    run(world, 2, input({ axis: 1, run: true }))
    expect(world.player.x + world.player.w).toBeCloseTo(5, 5)
  })

  it('stands on one-way planks but jumps through them from below', () => {
    const world = level(['', '', '', '', '', '', '  ---', '', '', 'P    F', '######', '######'])
    run(world, 0.3)
    world.player.x = 2.1
    world.step(STEP, input({ jump: true, jumpPressed: true }))
    run(world, 1.5, input({ jump: true }))
    expect(world.player.onGround).toBe(true)
    expect(world.player.y).toBeCloseTo(6, 5)
  })
})

describe('characters', () => {
  const flat = ['', '', '', '', '', '', '', '', '', '', '', 'P                            F', '##############################', '##############################']

  it('gives Zip the fastest run and Bun the slowest', () => {
    const speedAfterASecond = (character: CharacterId) => {
      const world = level(flat, character)
      run(world, 0.2)
      run(world, 1, input({ axis: 1, run: true }))
      return world.player.vx
    }
    expect(speedAfterASecond('zip')).toBeCloseTo(CHARACTERS.zip.moves.runSpeed, 5)
    expect(speedAfterASecond('zip')).toBeGreaterThan(speedAfterASecond('sprout'))
    expect(speedAfterASecond('sprout')).toBeGreaterThan(speedAfterASecond('bun'))
  })

  it('lets Bun jump the highest while every hero clears four tiles', () => {
    const bun = jumpPeak(level(flat, 'bun'))
    const sprout = jumpPeak(level(flat, 'sprout'))
    const zip = jumpPeak(level(flat, 'zip'))
    expect(bun).toBeGreaterThan(sprout)
    expect(sprout).toBeGreaterThan(zip)
    expect(zip).toBeGreaterThan(4.1)
  })

  it('lets only Bun glide while the jump button is held', () => {
    const fallSpeed = (character: CharacterId) => {
      const world = level(flat, character)
      world.player.y = 11
      run(world, 0.5, input({ jump: true }))
      return { vy: world.player.vy, gliding: world.player.gliding }
    }
    const bun = fallSpeed('bun')
    const sprout = fallSpeed('sprout')
    expect(bun.gliding).toBe(true)
    expect(bun.vy).toBeCloseTo(-(CHARACTERS.bun.moves.glideSpeed ?? 0), 5)
    expect(sprout.gliding).toBe(false)
    expect(sprout.vy).toBeLessThan(-20)
  })

  it('switches the moveset when the hero changes', () => {
    const world = level(flat, 'sprout')
    world.setCharacter('zip')
    run(world, 0.2)
    run(world, 1, input({ axis: 1 }))
    expect(world.character).toBe('zip')
    expect(world.player.vx).toBeCloseTo(CHARACTERS.zip.moves.walkSpeed, 5)
  })
})

describe('blocks', () => {
  it('turns a crate into a used block and pays a coin', () => {
    const world = level(['', '', '', '', '', '', '', '  C', '', '', '', 'P    F', '######', '######'])
    const log = events(world)
    run(world, 0.3)
    world.player.x = 2.15
    world.step(STEP, input({ jump: true, jumpPressed: true }))
    run(world, 0.6, input({ jump: true }))
    expect(world.tileAt(2, 6)).toBe(Tile.Used)
    expect(world.coinsCollected).toBe(1)
    expect(log).toContain('coin')
  })

  it('breaks bricks from below', () => {
    const world = level(['', '', '', '', '', '', '', '  B', '', '', '', 'P    F', '######', '######'])
    const log = events(world)
    run(world, 0.3)
    world.player.x = 2.15
    world.step(STEP, input({ jump: true, jumpPressed: true }))
    run(world, 0.6, input({ jump: true }))
    expect(world.tileAt(2, 6)).toBe(Tile.Empty)
    expect(world.debris.some((piece) => piece.active)).toBe(true)
    expect(log).toContain('break')
  })

  it('gives an extra life from a life crate', () => {
    const world = level(['', '', '', '', '', '', '', '  L', '', '', '', 'P    F', '######', '######'])
    run(world, 0.3)
    world.player.x = 2.15
    world.step(STEP, input({ jump: true, jumpPressed: true }))
    run(world, 0.6, input({ jump: true }))
    expect(world.lives).toBe(RULES.startLives + 1)
  })
})

describe('enemies and hazards', () => {
  it('defeats a slug when landing on it', () => {
    const world = level(['', '', '', '', '', '', '', '', '', '', '', 'P   s     F', '###########', '###########'])
    const log = events(world)
    const slug = world.enemies[0]
    world.player.x = slug.x
    world.player.y = 5
    run(world, 0.6)
    expect(slug.alive).toBe(false)
    expect(world.score).toBe(RULES.stompScore)
    expect(world.phase).toBe('playing')
    expect(log).toContain('stomp')
  })

  it('loses a life when touching a burr, even from above', () => {
    const world = level(['', '', '', '', '', '', '', '', '', '', '', 'P   k     F', '###########', '###########'])
    const burr = world.enemies[0]
    world.player.x = burr.x
    world.player.y = 5
    run(world, 0.6)
    expect(world.phase).toBe('dying')
    expect(world.lives).toBe(RULES.startLives - 1)
  })

  it('respawns after falling into a pit, then ends the game when lives run out', () => {
    const world = level(['', '', '', '', '', 'P         F', '##   ######', '##   ######'])
    const log = events(world)
    for (let life = RULES.startLives; life > 0; life--) {
      world.player.x = 2.5
      world.player.y = 2
      run(world, 1)
      expect(world.lives).toBe(life - 1)
      run(world, RULES.respawnDelay + 0.1)
    }
    expect(world.phase).toBe('gameover')
    expect(log.filter((event) => event === 'die')).toHaveLength(RULES.startLives)
    expect(log.at(-1)).toBe('gameover')
  })

  it('hurts on spikes', () => {
    const world = level(['', '', '', '', '', 'P  ^^     F', '###########', '###########'])
    run(world, 1.5, input({ axis: 1 }))
    expect(world.phase).toBe('dying')
  })
})

describe('falling rocks', () => {
  const ROWS = ['      r', '', '', '', '', 'P         F', '###########', '###########']

  it('warns first, then drops, shatters on the ground and waits for the next drop', () => {
    const world = level(ROWS)
    const log = events(world)
    const rock = world.rocks[0]
    run(world, 0.1)
    expect(rock.state).toBe('warning')
    expect(rock.floor).toBe(2)
    run(world, ROCKS.delay)
    expect(rock.state).toBe('falling')
    let crashedAfter = 0
    while (!log.includes('crash') && crashedAfter < 3) {
      world.step(STEP, NO_INPUT)
      crashedAfter += STEP
    }
    expect(log).toContain('crash')
    expect(rock.state).toBe('resting')
    expect(rock.timer).toBeCloseTo(ROCKS.period, 1)
    expect(world.quake).toBeGreaterThan(0)
    expect(world.debris.filter((piece) => piece.active && piece.kind === 'rock').length).toBeGreaterThan(0)
    expect(world.phase).toBe('playing')
  })

  it('costs a life when a rock lands on the player', () => {
    const world = level(ROWS)
    world.player.x = world.rocks[0].x
    run(world, 2)
    expect(world.phase).toBe('dying')
    expect(world.lives).toBe(RULES.startLives - 1)
  })

  it('cannot hurt the player right after a respawn', () => {
    const world = level(ROWS)
    world.player.x = world.rocks[0].x
    world.player.invulnerable = RULES.invulnerableTime
    run(world, 1.5)
    expect(world.phase).toBe('playing')
  })

  it('crushes an enemy standing under it', () => {
    const world = level(['      r', '', '', '', '', 'P    XsX  F', '###########', '###########'])
    const slug = world.enemies[0]
    run(world, 1.6)
    expect(slug.alive).toBe(false)
    expect(slug.flipped).toBe(true)
  })

  it('drops nearby rocks one after another', () => {
    const world = level(['  r   r', '', '', '', '', 'P         F', '###########', '###########'])
    const [first, second] = world.rocks
    expect(second.timer - first.timer).toBeCloseTo(ROCKS.stagger)
  })

  it('falls into a pit without shattering', () => {
    const world = level(['      r', '', '', '', '', 'P         F', '######  ###', '######  ###'])
    const log = events(world)
    const rock = world.rocks[0]
    run(world, 0.1)
    expect(rock.floor).toBeNull()
    run(world, 2)
    expect(log).not.toContain('crash')
    expect(rock.state).not.toBe('falling')
  })
})

describe('moving platforms', () => {
  it('carries the player sideways', () => {
    const world = level(['', '', '', '', '', '', '', '', ' m     M', '', '', 'P         F', '##       ##', '##       ##'])
    const mover = world.movers[0]
    world.player.x = mover.x + 1
    world.player.y = mover.y + mover.h + 0.01
    run(world, 0.05)
    expect(world.player.platform).toBe(mover)
    const offset = world.player.x - mover.x
    run(world, 1)
    expect(world.player.x - mover.x).toBeCloseTo(offset, 3)
    expect(mover.x).toBeGreaterThan(1.5)
  })
})

describe('goal', () => {
  it('completes the level and converts the remaining time into points', () => {
    const world = level(['', '', '', '', '', 'P   F', '#####', '#####'])
    const log = events(world)
    run(world, 2, input({ axis: 1 }))
    expect(['won', 'complete']).toContain(world.phase)
    run(world, 6)
    expect(world.phase).toBe('complete')
    expect(world.time).toBe(0)
    expect(world.score).toBeGreaterThanOrEqual((RULES.levelTime - 3) * RULES.timeBonus)
    expect(log).toContain('goal')
    expect(log.at(-1)).toBe('complete')
  })
})

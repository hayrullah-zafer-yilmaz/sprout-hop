import { CHARACTERS, type CharacterId, type Moveset } from './characters'
import { EFFECTS, PHYSICS, ROCKS, RULES } from './config'
import { ONE_WAY_TOLERANCE, isSolid, moveX, moveY, overlaps, type Box, type Point, type TileLookup } from './collision'
import {
  NO_INPUT,
  createCheckpoint,
  createCoin,
  createDebris,
  createEnemy,
  createGoal,
  createMover,
  createPlayer,
  createPop,
  createRock,
  createSpikes,
  standingSpot,
  type Bump,
  type Checkpoint,
  type Coin,
  type Debris,
  type Enemy,
  type GameEvent,
  type Goal,
  type InputState,
  type Mover,
  type Phase,
  type Player,
  type Pop,
  type Rock,
} from './entities'
import { Tile, type LevelData, type Spawn, type TileId } from './level'

const DEBRIS_PIECES: Record<Debris['kind'], { x: number; y: number; vx: number; vy: number }[]> = {
  brick: [
    { x: 0.25, y: 0.75, vx: -3, vy: 12 },
    { x: 0.75, y: 0.75, vx: 3, vy: 12 },
    { x: 0.25, y: 0.25, vx: -2.4, vy: 8 },
    { x: 0.75, y: 0.25, vx: 2.4, vy: 8 },
  ],
  rock: [
    { x: 0.2, y: 0.3, vx: -4.2, vy: 9 },
    { x: 0.8, y: 0.3, vx: 4.2, vy: 9 },
    { x: 0.35, y: 0.2, vx: -2, vy: 12 },
    { x: 0.65, y: 0.2, vx: 2, vy: 12 },
    { x: 0.5, y: 0.4, vx: 0.6, vy: 14 },
  ],
}

function createRocks(spawns: Spawn[]): Rock[] {
  let order = 0
  return spawns.map((spawn, index) => {
    const previous = spawns[index - 1]
    order = previous && spawn.x - previous.x <= ROCKS.groupGap ? order + 1 : 0
    return createRock(spawn, ROCKS.delay + order * ROCKS.stagger)
  })
}

export interface WorldOptions {
  character?: CharacterId
  lives?: number
}

function approach(value: number, target: number, step: number): number {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target)
}

function overwrite<T extends object>(target: T, values: NoInfer<T>): void {
  Object.assign(target, values)
}

function fall(body: { vy: number }, gravity: number, dt: number): void {
  body.vy = Math.max(body.vy - gravity * dt, -PHYSICS.maxFall)
}

export class World {
  readonly width: number
  readonly height: number
  readonly tiles: Uint8Array
  readonly player: Player
  readonly enemies: Enemy[]
  readonly coins: Coin[]
  readonly spikes: Box[]
  readonly movers: Mover[]
  readonly rocks: Rock[]
  readonly checkpoints: Checkpoint[]
  readonly goal: Goal
  readonly pops: Pop[] = Array.from({ length: EFFECTS.popCount }, createPop)
  readonly debris: Debris[] = Array.from({ length: EFFECTS.debrisCount }, createDebris)
  readonly bumps: Bump[] = []
  readonly changedTiles: Point[] = []
  readonly totalCoins: number

  phase: Phase = 'playing'
  character: CharacterId = 'sprout'
  clock = 0
  score = 0
  coinsCollected = 0
  lives: number
  time = RULES.levelTime
  quake = 0
  respawn: Point

  private moves: Moveset = CHARACTERS.sprout.moves
  private tallyCarry = 0
  private readonly listeners = new Set<(event: GameEvent) => void>()
  private readonly lookup: TileLookup = (x, y) => this.tileAt(x, y)

  constructor(level: LevelData, { character = 'sprout', lives = RULES.startLives }: WorldOptions = {}) {
    this.width = level.width
    this.height = level.height
    this.tiles = level.tiles.slice()
    this.lives = lives
    this.setCharacter(character)
    this.respawn = standingSpot(level.start)
    this.player = createPlayer(this.respawn)
    this.enemies = level.enemies.map(createEnemy)
    this.coins = level.coins.map(createCoin)
    this.spikes = level.spikes.map(createSpikes)
    this.movers = level.movers.map(createMover)
    this.rocks = createRocks(level.rocks)
    this.checkpoints = level.checkpoints.map(createCheckpoint)
    this.goal = createGoal(level.goal)
    this.totalCoins = this.coins.length + this.tiles.filter((tile) => tile === Tile.Crate).length
  }

  on(listener: (event: GameEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  setCharacter(character: CharacterId): void {
    this.character = character
    this.moves = CHARACTERS[character].moves
  }

  tileAt(x: number, y: number): TileId {
    if (x < 0 || x >= this.width) return Tile.Stone
    if (y < 0 || y >= this.height) return Tile.Empty
    return this.tiles[y * this.width + x] as TileId
  }

  step(dt: number, input: InputState): void {
    this.clock += dt
    this.updateEffects(dt)
    switch (this.phase) {
      case 'playing':
        this.updateMovers(dt)
        this.updatePlayer(dt, input)
        this.updateEnemies(dt)
        this.updateRocks(dt)
        this.checkInteractions(input)
        this.updateTimer(dt)
        break
      case 'dying':
        this.updateDying(dt)
        break
      case 'won':
        this.updateMovers(dt)
        this.updatePlayer(dt, NO_INPUT)
        this.updateEnemies(dt)
        this.updateRocks(dt)
        this.updateGoal(dt)
        break
      default:
        this.updateMovers(dt)
    }
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) listener(event)
  }

  private setTile(x: number, y: number, tile: TileId): void {
    this.tiles[y * this.width + x] = tile
    this.changedTiles.push({ x, y })
  }

  private updateMovers(dt: number): void {
    for (const mover of this.movers) {
      mover.dx = 0
      mover.dy = 0
      if (mover.wait > 0) {
        mover.wait -= dt
        continue
      }
      const current = mover.axis === 'x' ? mover.x : mover.y
      const next = Math.min(mover.max, Math.max(mover.min, current + mover.dir * PHYSICS.moverSpeed * dt))
      if (next === mover.max || next === mover.min) {
        mover.dir = next === mover.max ? -1 : 1
        mover.wait = PHYSICS.moverPause
      }
      if (mover.axis === 'x') {
        mover.dx = next - mover.x
        mover.x = next
      } else {
        mover.dy = next - mover.y
        mover.y = next
      }
    }
  }

  private updatePlayer(dt: number, input: InputState): void {
    const p = this.player
    const wasOnGround = p.onGround
    this.rideMover(p)
    this.steer(p, input, dt)
    this.jumpIfRequested(p, input, dt)
    this.applyGravity(p, input.jump, dt)
    moveX(this.lookup, p, p.vx * dt)
    const ceiling = this.movePlayerVertically(p, dt)

    if (p.onGround) {
      p.combo = 0
      if (!wasOnGround) p.landedAt = this.clock
    }
    if (ceiling) this.hitBlock(ceiling.x, ceiling.y)
    p.invulnerable = Math.max(0, p.invulnerable - dt)
    if (p.y < RULES.playerFallLimit) this.killPlayer(true)
  }

  private rideMover(p: Player): void {
    if (!p.platform) return
    moveX(this.lookup, p, p.platform.dx)
    p.y += p.platform.dy
  }

  private steer(p: Player, input: InputState, dt: number): void {
    const maxSpeed = input.run ? this.moves.runSpeed : this.moves.walkSpeed
    const turning = input.axis !== 0 && p.vx !== 0 && Math.sign(input.axis) !== Math.sign(p.vx)
    let accel = !p.onGround ? PHYSICS.airAccel : input.axis === 0 ? PHYSICS.groundDecel : this.moves.acceleration
    if (turning) accel *= PHYSICS.turnMultiplier
    p.vx = approach(p.vx, input.axis * maxSpeed, accel * dt)
    if (input.axis !== 0) p.facing = input.axis > 0 ? 1 : -1
  }

  private jumpIfRequested(p: Player, input: InputState, dt: number): void {
    p.coyote = p.onGround ? PHYSICS.coyoteTime : Math.max(0, p.coyote - dt)
    p.jumpBuffer = input.jumpPressed ? PHYSICS.jumpBuffer : Math.max(0, p.jumpBuffer - dt)
    if (p.jumpBuffer <= 0 || p.coyote <= 0) return
    const running = Math.abs(p.vx) > this.moves.walkSpeed + 0.5
    p.vy = this.moves.jumpVelocity + (running ? PHYSICS.runJumpBonus : 0)
    p.onGround = false
    p.platform = null
    p.coyote = 0
    p.jumpBuffer = 0
    this.emit('jump')
  }

  private applyGravity(p: Player, holdingJump: boolean, dt: number): void {
    const rising = p.vy > 0
    const gravity = rising ? (holdingJump ? PHYSICS.gravityUp : PHYSICS.gravityCut) : this.moves.fallGravity
    fall(p, gravity, dt)
    const glideSpeed = this.moves.glideSpeed
    const gliding = glideSpeed !== null && holdingJump && !rising && !p.onGround
    if (gliding) p.vy = Math.max(p.vy, -glideSpeed)
    p.gliding = gliding
  }

  private movePlayerVertically(p: Player, dt: number): Point | null {
    p.prevY = p.y
    const falling = p.vy <= 0
    const hit = moveY(this.lookup, p, p.vy * dt, p.prevY)
    p.onGround = hit.landed
    p.platform = null
    if (falling && !p.onGround) this.landOnMover(p)
    return hit.ceiling
  }

  private landOnMover(p: Player): void {
    for (const mover of this.movers) {
      if (p.x >= mover.x + mover.w || p.x + p.w <= mover.x) continue
      const top = mover.y + mover.h
      if (p.prevY >= top - ONE_WAY_TOLERANCE && p.y <= top) {
        p.y = top
        p.vy = 0
        p.onGround = true
        p.platform = mover
        return
      }
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (enemy.gone) continue
      if (enemy.alive) this.walkEnemy(enemy, dt)
      else this.animateDefeat(enemy, dt)
    }
  }

  private walkEnemy(enemy: Enemy, dt: number): void {
    if (!enemy.active) {
      if (Math.abs(enemy.x - this.player.x) > RULES.activationDistance) return
      enemy.active = true
    }
    enemy.vx = enemy.dir * PHYSICS.enemySpeed[enemy.kind]
    fall(enemy, PHYSICS.gravityDown, dt)
    const hitWall = moveX(this.lookup, enemy, enemy.vx * dt)
    if (hitWall || (enemy.onGround && this.edgeAhead(enemy))) enemy.dir = enemy.dir === 1 ? -1 : 1
    enemy.onGround = moveY(this.lookup, enemy, enemy.vy * dt, enemy.y).landed
    if (enemy.y < RULES.enemyFallLimit) {
      enemy.alive = false
      enemy.gone = true
    }
  }

  private edgeAhead(enemy: Enemy): boolean {
    const frontX = enemy.dir === 1 ? enemy.x + enemy.w + 0.02 : enemy.x - 0.02
    return this.tileAt(Math.floor(frontX), Math.floor(enemy.y - 0.1)) === Tile.Empty
  }

  private updateRocks(dt: number): void {
    for (const rock of this.rocks) {
      if (!rock.active) {
        if (Math.abs(rock.x - this.player.x) > RULES.activationDistance) continue
        rock.active = true
      }
      if (rock.state === 'falling') {
        this.dropRock(rock, dt)
        continue
      }
      rock.timer -= dt
      if (rock.state === 'resting' && rock.timer <= ROCKS.warning) {
        rock.state = 'warning'
        rock.floor = this.floorBelow(rock)
      }
      if (rock.state === 'warning' && rock.timer <= 0) {
        rock.state = 'falling'
        rock.y = rock.top
        rock.vy = 0
      }
    }
  }

  private floorBelow(rock: Rock): number | null {
    const left = Math.floor(rock.x)
    const right = Math.floor(rock.x + rock.w)
    for (let y = Math.min(this.height, Math.floor(rock.top)) - 1; y >= 0; y--) {
      for (let x = left; x <= right; x++) {
        const tile = this.tileAt(x, y)
        if (isSolid(tile) || tile === Tile.Plank) return y + 1
      }
    }
    return null
  }

  private dropRock(rock: Rock, dt: number): void {
    rock.vy = Math.max(rock.vy - ROCKS.gravity * dt, -ROCKS.maxFall)
    const landed = moveY(this.lookup, rock, rock.vy * dt, rock.y).landed
    this.crushEnemies(rock)
    if (landed) this.crashRock(rock)
    else if (rock.y < RULES.enemyFallLimit) this.resetRock(rock)
  }

  private crushEnemies(rock: Rock): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive || !overlaps(rock, enemy)) continue
      enemy.alive = false
      enemy.flipped = true
      enemy.vy = PHYSICS.knockBounce
      enemy.diedAt = this.clock
    }
  }

  private crashRock(rock: Rock): void {
    this.spawnDebris(rock.x, rock.y, 'rock')
    const distance = Math.abs(rock.x + rock.w / 2 - (this.player.x + this.player.w / 2))
    this.quake = Math.max(this.quake, Math.max(0, 1 - distance / EFFECTS.quakeReach))
    this.emit('crash')
    this.resetRock(rock)
  }

  private resetRock(rock: Rock): void {
    rock.state = 'resting'
    rock.timer = ROCKS.period
    rock.y = rock.top
    rock.vy = 0
  }

  private animateDefeat(enemy: Enemy, dt: number): void {
    if (enemy.flipped) {
      fall(enemy, PHYSICS.gravityDown, dt)
      enemy.y += enemy.vy * dt
      if (enemy.y < RULES.enemyFallLimit) enemy.gone = true
    } else if (this.clock - enemy.diedAt > RULES.defeatDuration) {
      enemy.gone = true
    }
  }

  private checkInteractions(input: InputState): void {
    if (this.phase !== 'playing') return
    this.collectCoins()
    if (this.touchEnemies(input.jump)) return
    if (this.touchesSpikes() || this.hitByRock()) {
      this.killPlayer(false)
      return
    }
    this.reachCheckpoints()
    this.reachGoal()
  }

  private collectCoins(): void {
    for (const coin of this.coins) {
      if (coin.collected || !overlaps(this.player, coin.hitbox)) continue
      coin.collected = true
      coin.collectedAt = this.clock
      this.addCoin()
    }
  }

  private touchEnemies(jumpHeld: boolean): boolean {
    const p = this.player
    for (const enemy of this.enemies) {
      if (!enemy.alive || !enemy.active || !overlaps(p, enemy)) continue
      const fromAbove = p.vy <= 0 && p.prevY >= enemy.y + enemy.h * RULES.stompHeight
      if (enemy.kind === 'slime' && fromAbove) {
        this.stomp(enemy, jumpHeld)
      } else if (p.invulnerable <= 0) {
        this.killPlayer(false)
        return true
      }
    }
    return false
  }

  private stomp(enemy: Enemy, jumpHeld: boolean): void {
    const p = this.player
    enemy.alive = false
    enemy.squashed = true
    enemy.diedAt = this.clock
    p.y = enemy.y + enemy.h
    p.vy = jumpHeld ? PHYSICS.stompBounceHeld : PHYSICS.stompBounce
    p.onGround = false
    p.combo++
    this.score += RULES.stompScore * 2 ** Math.min(p.combo - 1, 3)
    this.emit('stomp')
  }

  private touchesSpikes(): boolean {
    return this.player.invulnerable <= 0 && this.spikes.some((spikes) => overlaps(this.player, spikes))
  }

  private hitByRock(): boolean {
    return this.player.invulnerable <= 0 && this.rocks.some((rock) => rock.state === 'falling' && overlaps(this.player, rock))
  }

  private reachCheckpoints(): void {
    for (const checkpoint of this.checkpoints) {
      if (checkpoint.active || !overlaps(this.player, checkpoint.area)) continue
      checkpoint.active = true
      checkpoint.activatedAt = this.clock
      this.respawn = standingSpot(checkpoint)
      this.emit('checkpoint')
    }
  }

  private reachGoal(): void {
    const p = this.player
    if (p.x + p.w < this.goal.x + RULES.goalReach) return
    this.phase = 'won'
    this.goal.reached = true
    this.goal.reachedAt = this.clock
    this.time = Math.ceil(this.time)
    p.vx = 0
    p.facing = 1
    this.emit('goal')
  }

  private addCoin(): void {
    this.coinsCollected++
    this.score += RULES.coinScore
    this.emit('coin')
    if (this.coinsCollected % RULES.coinsPerLife === 0) this.gainLife()
  }

  private gainLife(): void {
    this.lives++
    this.emit('life')
  }

  private hitBlock(x: number, y: number): void {
    switch (this.tileAt(x, y)) {
      case Tile.Brick:
        this.breakBrick(x, y)
        break
      case Tile.Crate:
        this.openCrate(x, y, 'coin')
        break
      case Tile.LifeCrate:
        this.openCrate(x, y, 'life')
        break
      default:
        this.bump(x, y)
        this.emit('bump')
    }
    this.knockEnemiesOff(x, y)
  }

  private breakBrick(x: number, y: number): void {
    this.setTile(x, y, Tile.Empty)
    this.spawnDebris(x, y, 'brick')
    this.score += RULES.brickScore
    this.emit('break')
  }

  private openCrate(x: number, y: number, reward: Pop['kind']): void {
    this.setTile(x, y, Tile.Used)
    this.bump(x, y)
    this.spawnPop(reward, x, y + 1)
    if (reward === 'coin') this.addCoin()
    else this.gainLife()
  }

  private knockEnemiesOff(x: number, y: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive || !enemy.onGround) continue
      if (Math.abs(enemy.y - (y + 1)) > 0.05) continue
      if (enemy.x >= x + 1 || enemy.x + enemy.w <= x) continue
      enemy.alive = false
      enemy.flipped = true
      enemy.vy = PHYSICS.knockBounce
      enemy.diedAt = this.clock
      this.score += RULES.stompScore
      this.emit('stomp')
    }
  }

  private bump(x: number, y: number): void {
    const existing = this.bumps.find((item) => item.x === x && item.y === y)
    if (existing) existing.t = EFFECTS.bumpTime
    else this.bumps.push({ x, y, t: EFFECTS.bumpTime })
  }

  private spawnPop(kind: Pop['kind'], x: number, y: number): void {
    const pop = this.pops.find((item) => !item.active) ?? this.pops[0]
    overwrite(pop, {
      active: true,
      kind,
      x: x + 0.5,
      y,
      vy: kind === 'coin' ? EFFECTS.coinPopSpeed : EFFECTS.lifePopSpeed,
      age: 0,
    })
  }

  private spawnDebris(x: number, y: number, kind: Debris['kind']): void {
    for (const piece of DEBRIS_PIECES[kind]) {
      const debris = this.debris.find((item) => !item.active)
      if (!debris) return
      overwrite(debris, {
        active: true,
        kind,
        x: x + piece.x,
        y: y + piece.y,
        vx: piece.vx,
        vy: piece.vy,
        spin: piece.vx * 2,
        angle: 0,
        age: 0,
      })
    }
  }

  private updateEffects(dt: number): void {
    this.quake = Math.max(0, this.quake - EFFECTS.quakeDecay * dt)
    for (let i = this.bumps.length - 1; i >= 0; i--) {
      this.bumps[i].t -= dt
      if (this.bumps[i].t <= 0) this.bumps.splice(i, 1)
    }
    for (const pop of this.pops) {
      if (!pop.active) continue
      pop.age += dt
      if (pop.kind === 'coin') pop.vy -= EFFECTS.coinPopGravity * dt
      pop.y += pop.vy * dt
      const life = pop.kind === 'coin' ? EFFECTS.coinPopLife : EFFECTS.lifePopLife
      if (pop.age > life) pop.active = false
    }
    for (const piece of this.debris) {
      if (!piece.active) continue
      piece.age += dt
      piece.vy -= EFFECTS.debrisGravity * dt
      piece.x += piece.vx * dt
      piece.y += piece.vy * dt
      piece.angle += piece.spin * dt
      if (piece.age > EFFECTS.debrisLife) piece.active = false
    }
  }

  private updateTimer(dt: number): void {
    if (this.phase !== 'playing') return
    this.time = Math.max(0, this.time - dt)
    if (this.time === 0) this.killPlayer(false)
  }

  private killPlayer(fell: boolean): void {
    if (this.phase !== 'playing') return
    const p = this.player
    this.phase = 'dying'
    p.dead = true
    p.deadTimer = RULES.respawnDelay
    p.vx = 0
    p.vy = fell ? 0 : PHYSICS.deathBounce
    p.platform = null
    this.lives = Math.max(0, this.lives - 1)
    this.emit('die')
  }

  private updateDying(dt: number): void {
    const p = this.player
    p.deadTimer -= dt
    if (p.y > -6) {
      fall(p, PHYSICS.gravityDown * 0.7, dt)
      p.y += p.vy * dt
    }
    if (p.deadTimer > 0) return
    if (this.lives > 0) {
      this.respawnPlayer()
      return
    }
    this.phase = 'gameover'
    this.emit('gameover')
  }

  private respawnPlayer(): void {
    overwrite(this.player, { ...createPlayer(this.respawn), invulnerable: RULES.invulnerableTime })
    this.time = RULES.levelTime
    this.phase = 'playing'
    this.emit('respawn')
  }

  private updateGoal(dt: number): void {
    const goal = this.goal
    goal.flag = Math.min(1, (this.clock - goal.reachedAt) / RULES.flagRaiseTime)
    if (goal.flag < 1) return
    this.tallyCarry += RULES.tallyRate * dt
    let ticked = false
    while (this.tallyCarry >= 1 && this.time > 0) {
      this.tallyCarry -= 1
      this.time -= 1
      this.score += RULES.timeBonus
      ticked = true
    }
    if (ticked) this.emit('tally')
    if (this.time > 0) return
    this.time = 0
    this.phase = 'complete'
    this.emit('complete')
  }
}

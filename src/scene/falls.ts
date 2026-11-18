import {
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  TorusGeometry,
  type Texture,
} from 'three'
import { Batch, lowPoly, pick, type Placement } from './batch'
import { createRippleTexture, createSoftDotTexture, createWaterfallTexture } from './textures'

export interface Animated {
  update(dt: number): void
}

export interface Scenery {
  objects: Object3D[]
  animated: Animated[]
}

interface FallSpot {
  x: number
  width: number
  top: number
}

interface Puff {
  x: number
  y: number
  z: number
  size: number
  phase: number
}

const WATER_LEVEL = -9.8
const BEDROCK = WATER_LEVEL - 4
const CLIFF_Z = -48
const FALL_Z = -45
const RIDGE_HEIGHT = 0.85
const RIDGE_REACH = 0.52
const MIST_PARTICLES = 70
const MIST_HEIGHT = 8
const FOAM_PULSE = 2.6
const RAINBOW_COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa']
const CLIFF_COLORS = ['#6c8288', '#5f757b', '#7a9095', '#687d83']
const WET_ROCK_COLORS = ['#475b62', '#50656c', '#3f535a']

function fallSpots(width: number): FallSpot[] {
  return [
    { x: width * 0.09, width: 9, top: 21 },
    { x: width * 0.47, width: 13, top: 25 },
    { x: width * 0.82, width: 8, top: 19 },
  ]
}

function crag(x: number, z: number, top: number, width: number, depth: number, ry: number, color: string): Placement {
  const half = (top - BEDROCK) / 2
  return { x, y: BEDROCK + half, z, sx: width, sy: half / RIDGE_HEIGHT, sz: depth, ry, color }
}

function onRidge(rock: Placement, along: number): { x: number; z: number } {
  const reach = along * RIDGE_REACH * rock.sx
  const ry = rock.ry ?? 0
  return { x: rock.x + reach * Math.cos(ry), z: rock.z - reach * Math.sin(ry) }
}

class Waterfall implements Animated {
  readonly group = new Group()
  private readonly flows: { texture: Texture; speed: number }[] = []
  private readonly mist: Points
  private readonly mistSpeed = new Float32Array(MIST_PARTICLES)
  private readonly spot: FallSpot

  constructor(spot: FallSpot, random: () => number, dot: Texture) {
    this.spot = spot
    const height = spot.top - WATER_LEVEL
    const centerY = (spot.top + WATER_LEVEL) / 2
    this.addSheet(spot.width, height, centerY, FALL_Z, 0.95, 0.85, Math.floor(random() * 1000))
    this.addSheet(spot.width * 0.72, height, centerY, FALL_Z + 0.5, 0.6, 1.35, Math.floor(random() * 1000))

    const positions = new Float32Array(MIST_PARTICLES * 3)
    for (let i = 0; i < MIST_PARTICLES; i++) {
      positions.set([spot.x + (random() - 0.5) * spot.width * 1.4, WATER_LEVEL + random() * MIST_HEIGHT, FALL_Z + 1 + random() * 4], i * 3)
      this.mistSpeed[i] = 0.6 + random() * 1.2
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    this.mist = new Points(
      geometry,
      new PointsMaterial({ map: dot, size: 3.4, transparent: true, opacity: 0.38, depthWrite: false, color: '#ffffff' }),
    )
    this.mist.frustumCulled = false
    this.group.add(this.mist)
  }

  private addSheet(width: number, height: number, centerY: number, z: number, opacity: number, speed: number, seed: number): void {
    const texture = createWaterfallTexture(seed)
    texture.repeat.set(1, height / 14)
    const sheet = new Mesh(
      new PlaneGeometry(width, height),
      new MeshBasicMaterial({ map: texture, color: '#eaf8ff', transparent: true, opacity, depthWrite: false }),
    )
    sheet.position.set(this.spot.x, centerY, z)
    this.group.add(sheet)
    this.flows.push({ texture, speed })
  }

  update(dt: number): void {
    for (const flow of this.flows) flow.texture.offset.y += flow.speed * dt
    const positions = this.mist.geometry.attributes.position as BufferAttribute
    for (let i = 0; i < MIST_PARTICLES; i++) {
      let y = positions.getY(i) + this.mistSpeed[i] * dt
      if (y > WATER_LEVEL + MIST_HEIGHT) {
        y = WATER_LEVEL
        positions.setX(i, this.spot.x + (Math.random() - 0.5) * this.spot.width * 1.4)
      }
      positions.setY(i, y)
    }
    positions.needsUpdate = true
  }
}

function foamPuffs(random: () => number, spot: FallSpot): Puff[] {
  const crest = Math.round(spot.width * 0.7)
  const pool = Math.round(spot.width * 1.1)
  const lip = Array.from({ length: crest }, (_, i) => ({
    x: spot.x + ((i + 0.5) / crest - 0.5) * spot.width * 0.95,
    y: spot.top + random() * 0.2,
    z: FALL_Z + 0.4 + random() * 0.4,
    size: 0.45 + random() * 0.3,
    phase: random() * Math.PI * 2,
  }))
  const splash = Array.from({ length: pool }, (_, i) => ({
    x: spot.x + ((i + random()) / pool - 0.5) * spot.width * 1.15,
    y: WATER_LEVEL + 0.15 + random() * 0.35,
    z: FALL_Z + 0.8 + random() * 2.8,
    size: 0.65 + random() * 0.85,
    phase: random() * Math.PI * 2,
  }))
  return [...lip, ...splash]
}

class Foam implements Animated {
  readonly mesh: InstancedMesh
  private readonly puffs: Puff[]
  private readonly dummy = new Object3D()
  private time = 0

  constructor(puffs: Puff[]) {
    this.puffs = puffs
    const material = lowPoly('#f6fbff', { roughness: 0.75, emissive: '#d8edf6', emissiveIntensity: 0.3 })
    this.mesh = new InstancedMesh(new IcosahedronGeometry(1, 1), material, puffs.length)
    this.mesh.frustumCulled = false
    this.update(0)
  }

  update(dt: number): void {
    this.time += dt
    this.puffs.forEach((puff, i) => {
      const swell = 1 + Math.sin(this.time * FOAM_PULSE + puff.phase) * 0.14
      this.dummy.position.set(puff.x, puff.y, puff.z)
      this.dummy.scale.set(puff.size * 1.3 * swell, puff.size * 0.7 * swell, puff.size)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this.dummy.matrix)
    })
    this.mesh.instanceMatrix.needsUpdate = true
  }
}

class River implements Animated {
  readonly mesh: Mesh
  private readonly texture: Texture

  constructor(left: number, right: number) {
    const width = right - left + 200
    this.texture = createRippleTexture()
    this.texture.repeat.set(width / 10, 9)
    this.mesh = new Mesh(
      new PlaneGeometry(width, 90),
      new MeshStandardMaterial({ map: this.texture, roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.95 }),
    )
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.set((left + right) / 2, WATER_LEVEL, -36)
    this.mesh.receiveShadow = true
  }

  update(dt: number): void {
    this.texture.offset.y += dt * 0.05
  }
}

function createCliffs(random: () => number, left: number, right: number, spots: FallSpot[]): Object3D[] {
  const rocks = new Batch(new IcosahedronGeometry(1, 0), lowPoly('#ffffff'))
  const pines = new Batch(new ConeGeometry(1, 1, 7), lowPoly('#2f6f4f'))
  const boulders = new Batch(new IcosahedronGeometry(1, 0), lowPoly('#5f7a66'))
  for (let x = left; x < right; x += 3.2 + random() * 3) {
    const inGap = spots.some((spot) => Math.abs(x - spot.x) < spot.width * 0.65 + 1.5)
    if (inGap) continue
    const framing = spots.find((spot) => Math.abs(x - spot.x) < spot.width * 0.65 + 6)
    const top = framing ? framing.top + 1 + random() * 2 : 12 + random() * 9
    const rock = crag(x, CLIFF_Z - random() * 6, top, 3.2 + random() * 2.6, 3.5 + random() * 2, random() * Math.PI, pick(random, CLIFF_COLORS))
    rocks.add(rock)
    const trees = random() > 0.4 ? 1 + Math.floor(random() * 2) : 0
    for (let i = 0; i < trees; i++) {
      const size = 0.9 + random() * 0.7
      const foot = onRidge(rock, random() * 1.2 - 0.6)
      pines.add({ x: foot.x, y: top + size * 0.9, z: foot.z, sx: size * 0.65, sy: size * 2.6, sz: size * 0.65, ry: random() * Math.PI })
    }
    if (random() > 0.55) {
      const size = 1.2 + random() * 1.6
      boulders.add({ x: x + random() * 2, y: WATER_LEVEL + 0.3, z: CLIFF_Z + 6 + random() * 6, sx: size * 1.3, sy: size * 0.7, sz: size, ry: random() * Math.PI })
    }
  }
  for (const spot of spots) {
    for (let i = -1; i <= 1; i++) {
      const x = spot.x + i * spot.width * 0.36
      rocks.add(crag(x, FALL_Z - 3.2, spot.top - 0.3, spot.width * 0.42, 2.6, (random() - 0.5) * 0.5, pick(random, WET_ROCK_COLORS)))
    }
  }
  const far = new Batch(new IcosahedronGeometry(1, 0), lowPoly('#9db3bb'))
  for (let x = left - 30; x < right + 30; x += 8 + random() * 8) {
    const half = 18 + random() * 10
    far.add({ x, y: BEDROCK + half, z: -66 - random() * 8, sx: 6 + random() * 4, sy: half, sz: 5, ry: random() * Math.PI })
  }
  return [rocks.build(), pines.build(), boulders.build(), far.build()]
}

function createRainbow(spot: FallSpot): Group {
  const group = new Group()
  RAINBOW_COLORS.forEach((color, i) => {
    const arc = new Mesh(
      new TorusGeometry(7.4 - i * 0.28, 0.14, 6, 64, Math.PI),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false }),
    )
    group.add(arc)
  })
  group.position.set(spot.x, WATER_LEVEL + 1, FALL_Z + 6)
  return group
}

export function buildFallsScenery(random: () => number, left: number, right: number, levelWidth: number): Scenery {
  const spots = fallSpots(levelWidth)
  const dot = createSoftDotTexture()
  const waterfalls = spots.map((spot) => new Waterfall(spot, random, dot))
  const foam = new Foam(spots.flatMap((spot) => foamPuffs(random, spot)))
  const river = new River(left, right)
  return {
    objects: [river.mesh, ...createCliffs(random, left, right, spots), ...waterfalls.map((fall) => fall.group), foam.mesh, createRainbow(spots[0])],
    animated: [river, foam, ...waterfalls],
  }
}

import {
  BoxGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  type Camera,
} from 'three'
import { Tile, tileAt, type LevelData } from '../game/level'
import { Batch, lowPoly, pick, type Placement } from './batch'
import type { Animated, Scenery } from './canyon'
import { buildFallsScenery } from './falls'
import { createRandom, createSkyTexture } from './textures'
import type { DecorPalette, Theme } from './themes'
import { buildVolcanoScenery } from './volcano'

const MARGIN = 60
const VALLEY = -11
const CLOUD_SPEED = 0.6

function groundSurface(level: LevelData, x: number): number | null {
  for (let y = level.height - 1; y >= 0; y--) {
    if (tileAt(level, x, y) === Tile.Ground) return y + 1
  }
  return null
}

export function buildDecorations(level: LevelData, palette: DecorPalette, seed: number): Group {
  const random = createRandom(seed)
  const bushes = new Batch(new IcosahedronGeometry(0.42, 1), lowPoly(palette.bush), true)
  const stems = new Batch(new CylinderGeometry(0.025, 0.025, 1, 5), lowPoly(palette.stem))
  const glow = palette.glow ? { emissive: palette.glow, emissiveIntensity: 0.9 } : {}
  const flowers = new Batch(new IcosahedronGeometry(0.09, 0), lowPoly('#ffffff', { roughness: 0.6, ...glow }))
  const tufts = new Batch(new ConeGeometry(0.06, 1, 4), lowPoly(palette.tuft))
  const rocks = new Batch(new IcosahedronGeometry(0.22, 0), lowPoly(palette.rock), true)
  const petals = palette.petals
  const reserved = new Set([...level.spikes, ...level.checkpoints, level.goal].map((spawn) => spawn.x))

  for (let x = 0; x < level.width; x++) {
    const surface = groundSurface(level, x)
    if (surface === null || tileAt(level, x, surface) !== Tile.Empty || reserved.has(x)) continue
    const roll = random()
    if (roll < 0.16) {
      const z = -1.05 + random() * 0.2
      const s = 0.8 + random() * 0.5
      bushes.add({ x: x + 0.5, y: surface + 0.15 * s, z, sx: s, sy: s * 0.85, sz: s })
      bushes.add({ x: x + 0.1, y: surface + 0.05, z: z + 0.1, sx: s * 0.7, sy: s * 0.6, sz: s * 0.7 })
      bushes.add({ x: x + 0.9, y: surface + 0.05, z: z - 0.05, sx: s * 0.75, sy: s * 0.65, sz: s * 0.75 })
    } else if (roll < 0.42) {
      const count = 1 + Math.floor(random() * 3)
      for (let i = 0; i < count; i++) {
        const fx = x + 0.15 + random() * 0.7
        const fz = -1.3 + random() * 0.8
        const height = 0.22 + random() * 0.18
        stems.add({ x: fx, y: surface + height / 2, z: fz, sx: 1, sy: height, sz: 1 })
        flowers.add({ x: fx, y: surface + height, z: fz, sx: 1, sy: 0.8, sz: 1, color: pick(random, petals) })
      }
    } else if (roll < 0.6) {
      for (let i = 0; i < 4; i++) {
        const height = 0.18 + random() * 0.16
        tufts.add({ x: x + random(), y: surface + height / 2, z: -1.4 + random() * 1.1, sx: 1, sy: height, sz: 1, ry: random() * Math.PI })
      }
    } else if (roll < 0.66) {
      const s = 0.7 + random() * 0.6
      rocks.add({ x: x + 0.5, y: surface + 0.08, z: -1.15, sx: s * 1.3, sy: s * 0.8, sz: s, ry: random() * 3 })
    }
  }

  const group = new Group()
  group.name = 'decorations'
  for (const batch of [bushes, stems, flowers, tufts, rocks]) group.add(batch.build())
  return group
}

function createSky(colors: Theme['sky']): Mesh {
  const sky = new Mesh(
    new PlaneGeometry(900, 260),
    new MeshBasicMaterial({ map: createSkyTexture(colors), fog: false, depthWrite: false }),
  )
  sky.position.z = -200
  sky.renderOrder = -10
  return sky
}

function createSun([core, glow]: NonNullable<Theme['sunDisc']>): Mesh {
  const disc = (radius: number, color: string, opacity: number) =>
    new Mesh(
      new CircleGeometry(radius, 40),
      new MeshBasicMaterial({ color, fog: false, transparent: true, opacity, depthWrite: false }),
    )
  const sun = disc(9, core, 0.95)
  const halo = disc(16, glow, 0.25)
  halo.position.z = -0.1
  sun.add(halo)
  sun.position.z = -190
  sun.renderOrder = -9
  return sun
}

function createForest(random: () => number, left: number, right: number): InstancedMesh[] {
  const trunks = new Batch(new CylinderGeometry(0.22, 0.32, 1, 6), lowPoly('#7a5236'))
  const crowns = new Batch(new IcosahedronGeometry(1, 0), lowPoly('#ffffff'))
  const pines = new Batch(new ConeGeometry(1, 1, 7), lowPoly('#ffffff'))
  const greens = ['#3f9a4c', '#4fae4f', '#5fbb57', '#2f7d4a']
  for (let x = left; x < right; x += 1.6 + random() * 2.6) {
    const z = -12 - random() * 22
    const s = 1.1 + random() * 0.9
    const trunkHeight = 2.2 * s
    const top = VALLEY + trunkHeight
    trunks.add({ x, y: VALLEY + trunkHeight / 2, z, sx: s, sy: trunkHeight, sz: s })
    const color = pick(random, greens)
    if (random() > 0.45) {
      crowns.add({ x, y: top + 1.1 * s, z, sx: 1.6 * s, sy: 1.5 * s, sz: 1.6 * s, ry: random() * Math.PI, color })
      continue
    }
    for (let layer = 0; layer < 3; layer++) {
      const radius = (1.5 - layer * 0.35) * s
      pines.add({ x, y: top + (0.6 + layer * 1.1) * s, z, sx: radius, sy: 1.8 * s, sz: radius, ry: random() * Math.PI, color: '#2f7d4a' })
    }
  }
  return [trunks.build(), crowns.build(), pines.build()]
}

function createHills(random: () => number, left: number, right: number): InstancedMesh {
  const hills = new Batch(new IcosahedronGeometry(1, 2), lowPoly('#ffffff'))
  const colors = ['#7cc46a', '#6bb862', '#8fcf74']
  for (let x = left; x < right; x += 14 + random() * 12) {
    const radius = 14 + random() * 10
    hills.add({ x, y: -15 + random() * 3, z: -34 - random() * 14, sx: radius * 1.4, sy: radius, sz: radius, color: pick(random, colors) })
  }
  return hills.build()
}

function createMountains(random: () => number, left: number, right: number, colors: [string, string]): InstancedMesh[] {
  const peaks = new Batch(new ConeGeometry(1, 1, 6), lowPoly('#ffffff'))
  const caps = new Batch(new ConeGeometry(1, 1, 6), lowPoly('#f4f8ff'))
  for (let x = left - 40; x < right + 40; x += 26 + random() * 20) {
    const radius = 22 + random() * 14
    const height = 30 + random() * 22
    const z = -95 - random() * 30
    const ry = random() * Math.PI
    const color = random() > 0.5 ? colors[0] : colors[1]
    peaks.add({ x, y: -10 + height / 2, z, sx: radius, sy: height, sz: radius, ry, color })
    caps.add({ x, y: -10 + height * 0.86, z: z + 0.2, sx: radius * 0.29, sy: height * 0.29, sz: radius * 0.29, ry })
  }
  return [peaks.build(), caps.build()]
}

interface Cloud {
  x: number
  y: number
  z: number
  puffs: Placement[]
}

class CloudField {
  readonly mesh: InstancedMesh
  private readonly clouds: Cloud[] = []
  private readonly left: number
  private readonly span: number
  private readonly dummy = new Object3D()

  constructor(random: () => number, left: number, right: number, style: NonNullable<Theme['clouds']>) {
    this.left = left
    this.span = right - left
    for (let x = left; x < right; x += 12 + random() * 14) {
      const count = 3 + Math.floor(random() * 3)
      const puffs = Array.from({ length: count }, (_, i) => {
        const size = 1.2 + random() * 1.3
        return { x: i * 1.5 - count * 0.7, y: random() * 0.8, z: random() * 0.6, sx: size * 1.2, sy: size, sz: size }
      })
      this.clouds.push({ x, y: 12 + random() * 7, z: -22 - random() * 22, puffs })
    }
    const total = this.clouds.reduce((sum, cloud) => sum + cloud.puffs.length, 0)
    const material = lowPoly(style.color, { emissive: new Color(style.glow), emissiveIntensity: style.intensity })
    this.mesh = new InstancedMesh(new IcosahedronGeometry(1, 1), material, total)
    this.mesh.frustumCulled = false
    this.writeAll()
  }

  drift(distance: number): void {
    this.mesh.position.x += distance
    let wrapped = false
    for (const cloud of this.clouds) {
      if (this.mesh.position.x + cloud.x <= this.left + this.span) continue
      cloud.x -= this.span
      wrapped = true
    }
    if (wrapped) this.writeAll()
  }

  private writeAll(): void {
    let index = 0
    for (const cloud of this.clouds) {
      for (const puff of cloud.puffs) {
        this.dummy.position.set(cloud.x + puff.x, cloud.y + puff.y, cloud.z + puff.z)
        this.dummy.scale.set(puff.sx, puff.sy, puff.sz)
        this.dummy.updateMatrix()
        this.mesh.setMatrixAt(index++, this.dummy.matrix)
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }
}

function buildMeadowScenery(random: () => number, left: number, right: number, levelWidth: number): Scenery {
  const valley = new Mesh(new BoxGeometry(right - left + 200, 2, 90), lowPoly('#4f9e4a'))
  valley.position.set(levelWidth / 2, VALLEY - 1, -40)
  valley.receiveShadow = true
  const forest = createForest(random, left, right)
  const hills = createHills(random, left, right)
  const mountains = createMountains(random, left, right, ['#8ea9cc', '#9db4d4'])
  return { objects: [valley, ...forest, hills, ...mountains], animated: [] }
}

function buildWaterfallScenery(random: () => number, left: number, right: number, levelWidth: number): Scenery {
  const mountains = createMountains(random, left, right, ['#8fa9bd', '#a2b8c6'])
  const falls = buildFallsScenery(random, left, right, levelWidth)
  return { objects: [...mountains, ...falls.objects], animated: falls.animated }
}

const BUILDERS: Record<Theme['backdrop'], typeof buildMeadowScenery> = {
  meadow: buildMeadowScenery,
  falls: buildWaterfallScenery,
  volcano: buildVolcanoScenery,
}

export class Backdrop {
  readonly group = new Group()
  private readonly sky: Mesh
  private readonly sun: Mesh | null
  private readonly clouds: CloudField | null
  private readonly animated: Animated[]

  constructor(level: LevelData, theme: Theme) {
    const random = createRandom(theme.seeds.backdrop)
    const left = -MARGIN
    const right = level.width + MARGIN
    const scenery = BUILDERS[theme.backdrop](random, left, right, level.width)
    this.sky = createSky(theme.sky)
    this.sun = theme.sunDisc ? createSun(theme.sunDisc) : null
    this.clouds = theme.clouds ? new CloudField(random, left, right, theme.clouds) : null
    this.animated = scenery.animated
    this.group.name = 'backdrop'
    this.group.add(this.sky)
    if (this.sun) this.group.add(this.sun)
    this.group.add(...scenery.objects)
    if (this.clouds) this.group.add(this.clouds.mesh)
  }

  update(camera: Camera | undefined, delta: number): void {
    const dt = Math.min(delta, 0.1)
    if (camera) {
      this.sky.position.set(camera.position.x, camera.position.y + 12, this.sky.position.z)
      this.sun?.position.set(camera.position.x + 55, camera.position.y + 34, this.sun.position.z)
    }
    this.clouds?.drift(dt * CLOUD_SPEED)
    for (const item of this.animated) item.update(dt)
  }
}

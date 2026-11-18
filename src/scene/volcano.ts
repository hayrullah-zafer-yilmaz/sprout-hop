import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  TubeGeometry,
  Vector3,
  type Texture,
} from 'three'
import { lowPoly } from './batch'
import { FALL_Z, buildCanyon, type Animated, type CanyonStyle, type FallSpot, type Scenery } from './canyon'
import { createLavaTexture, createLavafallTexture, createSmokeTexture, createSoftDotTexture } from './textures'

export const LAVA_LEVEL = 0.9

const LAVA: CanyonStyle = {
  surface: LAVA_LEVEL,
  sheet: { texture: createLavafallTexture, tint: '#ffffff', speed: 0.35, shape: { spread: 0.35, bulge: 0.6, fade: 0.05 }, fog: false },
  mist: { color: '#ffb048', size: 0.55, opacity: 0.85, glow: true, count: 16, height: 3 },
  foam: null,
  sea: { texture: createLavaTexture, scale: 22, flow: 0.01, glow: 0.36, opacity: 1, roughness: 0.92, metalness: 0 },
  cliffs: {
    rocks: ['#3a3133', '#2f2729', '#453b3d', '#342b2d'],
    wet: ['#5a2212', '#4a1a0e', '#6a2a14'],
    boulder: '#3a2f2c',
    far: '#4a3a3c',
    pine: null,
    height: [5.5, 5],
    farHeight: [6, 5],
    source: 'cave',
  },
}

const VOLCANO = { base: -16, height: 40, top: 7, bottom: 62, z: -150 }
const STREAMS = [-0.55, -0.08, 0.42]
const PLUME_PUFFS = 10
const HAZE = 16
const HAZE_BAND = { bottom: 8, top: 24 }
const EMBERS = 260
const EMBER_TOP = 22

function volcanoSpots(width: number): FallSpot[] {
  return [
    { x: width * 0.26, width: 7, top: 13 },
    { x: width * 0.68, width: 9, top: 15 },
  ]
}

function rugged(geometry: BufferGeometry, random: () => number, amount: number): BufferGeometry {
  const position = geometry.attributes.position
  const offsets = new Map<string, number>()
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`
    let offset = offsets.get(key)
    if (offset === undefined) {
      offset = 1 + (random() - 0.5) * amount
      offsets.set(key, offset)
    }
    position.setXYZ(i, x * offset, y, z * offset)
  }
  geometry.computeVertexNormals()
  return geometry
}

function streamGeometry(x: number, angle: number, wiggle: number): TubeGeometry {
  const { base, height, top, bottom, z } = VOLCANO
  const points: Vector3[] = []
  for (let i = 0; i <= 12; i++) {
    const t = (i / 12) * 0.75
    const radius = top + (bottom - top) * t + 0.6
    const a = angle + Math.sin(t * 12 + wiggle) * 0.05
    points.push(new Vector3(x + Math.sin(a) * radius, base + height - t * height, z + Math.cos(a) * radius))
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 48, 1.3, 6, false)
}

interface Plume {
  sprite: Sprite
  phase: number
  drift: number
  size: number
  speed: number
}

interface Wisp {
  sprite: Sprite
  x: number
  y: number
  speed: number
  rise: number
  strength: number
}

function smokeSprite(smoke: Texture, color: string): Sprite {
  return new Sprite(new SpriteMaterial({ map: smoke, color, transparent: true, depthWrite: false, opacity: 0 }))
}

class Volcano implements Animated {
  readonly objects: Object3D[]
  private readonly plume: Plume[]
  private readonly crater: Vector3
  private readonly glow: Sprite
  private time = 0

  constructor(random: () => number, x: number, dot: Texture, smoke: Texture) {
    const { base, height, top, bottom, z } = VOLCANO
    const peak = base + height
    this.crater = new Vector3(x, peak, z)
    const mountain = new Mesh(rugged(new CylinderGeometry(top, bottom, height, 12, 6, true), random, 0.12), lowPoly('#2b2123'))
    mountain.position.set(x, base + height / 2, z)
    const crater = new Mesh(new CircleGeometry(top * 0.95, 14).rotateX(-Math.PI / 2), new MeshBasicMaterial({ color: '#ffb347' }))
    crater.position.set(x, peak - 0.5, z)
    const lava = new MeshBasicMaterial({ color: '#ff6a14' })
    const streams = STREAMS.map((angle, i) => new Mesh(streamGeometry(x, angle, i * 2.1), lava))
    this.glow = new Sprite(
      new SpriteMaterial({ map: dot, color: '#ff6a1a', blending: AdditiveBlending, transparent: true, depthWrite: false, fog: false }),
    )
    this.glow.scale.set(64, 42, 1)
    this.glow.position.set(x, peak + 3, z + 2)
    this.plume = Array.from({ length: PLUME_PUFFS }, (_, i) => ({
      sprite: smokeSprite(smoke, '#7a6a68'),
      phase: i / PLUME_PUFFS,
      drift: 0.6 + random() * 0.8,
      size: 0.8 + random() * 0.5,
      speed: 0.035 + random() * 0.02,
    }))
    this.objects = [mountain, crater, ...streams, this.glow, ...this.plume.map((puff) => puff.sprite)]
    this.update(0)
  }

  update(dt: number): void {
    this.time += dt
    this.glow.material.opacity = 0.75 + Math.sin(this.time * 1.7) * 0.15
    for (const puff of this.plume) {
      puff.phase = (puff.phase + dt * puff.speed) % 1
      const t = puff.phase
      const size = (6 + t * 24) * puff.size
      puff.sprite.position.set(this.crater.x + t * t * 36 * puff.drift, this.crater.y + 1 + t * 44, this.crater.z - t * 6)
      puff.sprite.scale.set(size, size * 0.85, 1)
      puff.sprite.material.rotation = t * 1.2 * puff.drift
      puff.sprite.material.opacity = 0.85 * Math.min(1, t * 6) * (1 - t) ** 1.3
    }
  }
}

class FallGlow implements Animated {
  readonly glows: Sprite[]
  private time = 0

  constructor(spots: FallSpot[], dot: Texture) {
    this.glows = spots.map((spot) => {
      const glow = new Sprite(
        new SpriteMaterial({ map: dot, color: '#ff6a1a', blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5 }),
      )
      glow.scale.set(spot.width * 2.4, spot.width * 0.9, 1)
      glow.position.set(spot.x, LAVA_LEVEL + 0.8, FALL_Z + 1.5)
      return glow
    })
    this.update(0)
  }

  update(dt: number): void {
    this.time += dt
    this.glows.forEach((glow, i) => {
      glow.material.opacity = 0.5 + Math.sin(this.time * 2.1 + i) * 0.12
    })
  }
}

class Haze implements Animated {
  readonly sprites: Sprite[]
  private readonly wisps: Wisp[]
  private readonly left: number
  private readonly span: number

  constructor(random: () => number, left: number, right: number, smoke: Texture) {
    this.left = left
    this.span = right - left
    this.wisps = Array.from({ length: HAZE }, (_, i) => {
      const sprite = smokeSprite(smoke, '#8a7672')
      const width = 30 + random() * 22
      sprite.scale.set(width, width * 0.55, 1)
      sprite.position.z = -45 - random() * 45
      sprite.material.rotation = (random() - 0.5) * 0.6
      return {
        sprite,
        x: left + ((i + random()) / HAZE) * this.span,
        y: HAZE_BAND.bottom + random() * (HAZE_BAND.top - HAZE_BAND.bottom),
        speed: 0.4 + random() * 0.5,
        rise: 0.12 + random() * 0.15,
        strength: 0.38 + random() * 0.2,
      }
    })
    this.sprites = this.wisps.map((wisp) => wisp.sprite)
    this.update(0)
  }

  update(dt: number): void {
    for (const wisp of this.wisps) {
      wisp.x += wisp.speed * dt
      wisp.y += wisp.rise * dt
      if (wisp.x > this.left + this.span) wisp.x -= this.span
      if (wisp.y > HAZE_BAND.top) wisp.y = HAZE_BAND.bottom
      const height = (wisp.y - HAZE_BAND.bottom) / (HAZE_BAND.top - HAZE_BAND.bottom)
      wisp.sprite.position.x = wisp.x
      wisp.sprite.position.y = wisp.y
      wisp.sprite.material.opacity = wisp.strength * Math.sin(Math.PI * height)
    }
  }
}

class Embers implements Animated {
  readonly points: Points
  private readonly speeds = new Float32Array(EMBERS)
  private readonly phases = new Float32Array(EMBERS)
  private readonly left: number
  private readonly span: number
  private time = 0

  constructor(random: () => number, left: number, right: number, dot: Texture) {
    this.left = left
    this.span = right - left
    const positions = new Float32Array(EMBERS * 3)
    for (let i = 0; i < EMBERS; i++) {
      positions.set([left + random() * this.span, LAVA_LEVEL + random() * (EMBER_TOP - LAVA_LEVEL), -26 + random() * 30], i * 3)
      this.speeds[i] = 0.5 + random() * 1.4
      this.phases[i] = random() * Math.PI * 2
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    this.points = new Points(
      geometry,
      new PointsMaterial({ map: dot, color: '#ffa848', size: 0.32, transparent: true, opacity: 0.95, depthWrite: false, blending: AdditiveBlending }),
    )
    this.points.frustumCulled = false
  }

  update(dt: number): void {
    this.time += dt
    const positions = this.points.geometry.attributes.position as BufferAttribute
    for (let i = 0; i < EMBERS; i++) {
      let x = positions.getX(i) + Math.sin(this.time * 1.4 + this.phases[i]) * 0.35 * dt
      let y = positions.getY(i) + this.speeds[i] * dt
      if (y > EMBER_TOP) {
        y = LAVA_LEVEL
        x = this.left + Math.random() * this.span
      }
      positions.setXY(i, x, y)
    }
    positions.needsUpdate = true
  }
}

export function buildVolcanoScenery(random: () => number, left: number, right: number, levelWidth: number): Scenery {
  const spots = volcanoSpots(levelWidth)
  const canyon = buildCanyon(random, left, right, spots, LAVA)
  const dot = createSoftDotTexture()
  const smoke = createSmokeTexture()
  const volcano = new Volcano(random, levelWidth * 0.58, dot, smoke)
  const glows = new FallGlow(spots, dot)
  const haze = new Haze(random, left, right, smoke)
  const embers = new Embers(random, left, right, dot)
  return {
    objects: [...canyon.objects, ...volcano.objects, ...glows.glows, ...haze.sprites, embers.points],
    animated: [...canyon.animated, volcano, glows, haze, embers],
  }
}

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  type Texture,
} from 'three'
import { Batch, lowPoly, pick, type Placement } from './batch'
import { createSoftDotTexture } from './textures'

export interface Animated {
  update(dt: number): void
}

export interface Scenery {
  objects: Object3D[]
  animated: Animated[]
}

export interface FallSpot {
  x: number
  width: number
  top: number
}

export interface SheetShape {
  spread: number
  bulge: number
  fade: number
}

export interface CanyonStyle {
  surface: number
  sheet: { texture: (seed: number) => Texture; tint: string; speed: number; shape: SheetShape | null; fog: boolean }
  mist: { color: string; size: number; opacity: number; glow: boolean; count: number; height: number }
  foam: { color: string; emissive: string; intensity: number } | null
  sea: { texture: () => Texture; scale: number; flow: number; glow: number; opacity: number; roughness: number; metalness: number }
  cliffs: {
    rocks: string[]
    wet: string[]
    boulder: string
    far: string
    pine: string | null
    height: [number, number]
    farHeight: [number, number]
    source: 'crest' | 'cave'
  }
}

interface Puff {
  x: number
  y: number
  z: number
  size: number
  phase: number
}

export const CLIFF_Z = -48
export const FALL_Z = -45
const SEA_DEPTH = 90
const RIDGE_HEIGHT = 0.85
const RIDGE_REACH = 0.52
const CAVE_WALL = 2.5
const FOAM_PULSE = 2.6
const GLOW_PULSE = 1.3

function crag(bedrock: number, x: number, z: number, top: number, width: number, depth: number, ry: number, color: string): Placement {
  const half = (top - bedrock) / 2
  return { x, y: bedrock + half, z, sx: width, sy: half / RIDGE_HEIGHT, sz: depth, ry, color }
}

function sheetGeometry(width: number, height: number, { spread, bulge, fade }: SheetShape): BufferGeometry {
  const geometry = new PlaneGeometry(width, height, 10, 24)
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 4)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const drop = 0.5 - y / height
    const across = (2 * x) / width
    position.setXYZ(i, x * (1 + spread * drop * drop), y, bulge * Math.cos((across * Math.PI) / 2) * (0.5 + 0.5 * drop))
    colors.set([1, 1, 1, Math.max(0, Math.min(1, drop / fade, (1 - drop) / fade))], i * 4)
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 4))
  return geometry
}

function onRidge(rock: Placement, along: number): { x: number; z: number } {
  const reach = along * RIDGE_REACH * rock.sx
  const ry = rock.ry ?? 0
  return { x: rock.x + reach * Math.cos(ry), z: rock.z - reach * Math.sin(ry) }
}

class Fall implements Animated {
  readonly group = new Group()
  private readonly flows: { texture: Texture; speed: number }[] = []
  private readonly mist: Points
  private readonly mistSpeed: Float32Array
  private readonly mistHeight: number
  private readonly spot: FallSpot
  private readonly surface: number

  constructor(spot: FallSpot, random: () => number, dot: Texture, style: CanyonStyle) {
    this.spot = spot
    this.surface = style.surface
    const { color, size, opacity, glow, count } = style.mist
    this.mistSpeed = new Float32Array(count)
    this.mistHeight = style.mist.height
    const height = spot.top - style.surface
    const centerY = (spot.top + style.surface) / 2
    this.addSheet(spot.width, height, centerY, FALL_Z, 0.95, 0.85, Math.floor(random() * 1000), style)
    this.addSheet(spot.width * 0.72, height, centerY, FALL_Z + 0.5, 0.6, 1.35, Math.floor(random() * 1000), style)

    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions.set([spot.x + (random() - 0.5) * spot.width * 1.4, style.surface + random() * this.mistHeight, FALL_Z + 1 + random() * 4], i * 3)
      this.mistSpeed[i] = 0.6 + random() * 1.2
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    this.mist = new Points(
      geometry,
      new PointsMaterial({ map: dot, size, transparent: true, opacity, depthWrite: false, color, blending: glow ? AdditiveBlending : NormalBlending }),
    )
    this.mist.frustumCulled = false
    this.group.add(this.mist)
  }

  private addSheet(width: number, height: number, centerY: number, z: number, opacity: number, speed: number, seed: number, style: CanyonStyle): void {
    const { shape } = style.sheet
    const texture = style.sheet.texture(seed)
    texture.repeat.set(1, height / 14)
    const sheet = new Mesh(
      shape ? sheetGeometry(width, height, shape) : new PlaneGeometry(width, height),
      new MeshBasicMaterial({ map: texture, color: style.sheet.tint, transparent: true, opacity, depthWrite: false, vertexColors: shape !== null, fog: style.sheet.fog }),
    )
    sheet.position.set(this.spot.x, centerY, z)
    this.group.add(sheet)
    this.flows.push({ texture, speed: speed * style.sheet.speed })
  }

  update(dt: number): void {
    for (const flow of this.flows) flow.texture.offset.y += flow.speed * dt
    const positions = this.mist.geometry.attributes.position as BufferAttribute
    for (let i = 0; i < this.mistSpeed.length; i++) {
      let y = positions.getY(i) + this.mistSpeed[i] * dt
      if (y > this.surface + this.mistHeight) {
        y = this.surface
        positions.setX(i, this.spot.x + (Math.random() - 0.5) * this.spot.width * 1.4)
      }
      positions.setY(i, y)
    }
    positions.needsUpdate = true
  }
}

function foamPuffs(random: () => number, spot: FallSpot, surface: number): Puff[] {
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
    y: surface + 0.15 + random() * 0.35,
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

  constructor(puffs: Puff[], { color, emissive, intensity }: NonNullable<CanyonStyle['foam']>) {
    this.puffs = puffs
    const material = lowPoly(color, { roughness: 0.75, emissive, emissiveIntensity: intensity })
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

class Sea implements Animated {
  readonly mesh: Mesh
  private readonly texture: Texture
  private readonly material: MeshStandardMaterial
  private readonly style: CanyonStyle['sea']
  private time = 0

  constructor(left: number, right: number, surface: number, style: CanyonStyle['sea']) {
    const width = right - left + 200
    this.style = style
    this.texture = style.texture()
    this.texture.repeat.set(width / style.scale, SEA_DEPTH / style.scale)
    const glowing = style.glow > 0
    this.material = new MeshStandardMaterial({
      map: this.texture,
      roughness: style.roughness,
      metalness: style.metalness,
      transparent: style.opacity < 1,
      opacity: style.opacity,
      emissive: glowing ? '#ffffff' : '#000000',
      emissiveMap: glowing ? this.texture : null,
      emissiveIntensity: style.glow,
    })
    this.mesh = new Mesh(new PlaneGeometry(width, SEA_DEPTH), this.material)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.set((left + right) / 2, surface, -36)
    this.mesh.receiveShadow = true
  }

  update(dt: number): void {
    this.time += dt
    this.texture.offset.y += dt * this.style.flow
    if (this.style.glow > 0) this.material.emissiveIntensity = this.style.glow * (1 + Math.sin(this.time * GLOW_PULSE) * 0.08)
  }
}

function createCliffs(random: () => number, left: number, right: number, spots: FallSpot[], style: CanyonStyle): Object3D[] {
  const { rocks: rockColors, wet, boulder, far: farColor, pine, height, farHeight, source } = style.cliffs
  const bedrock = style.surface - 4
  const rocks = new Batch(new IcosahedronGeometry(1, 0), lowPoly('#ffffff'))
  const pines = new Batch(new ConeGeometry(1, 1, 7), lowPoly(pine ?? '#000000'))
  const boulders = new Batch(new IcosahedronGeometry(1, 0), lowPoly(boulder))
  for (let x = left; x < right; x += 3.2 + random() * 3) {
    const inGap = spots.some((spot) => Math.abs(x - spot.x) < spot.width * 0.65 + 1.5)
    if (inGap) continue
    const framing = spots.find((spot) => Math.abs(x - spot.x) < spot.width * 0.65 + 6)
    const top = framing ? framing.top + 1 + random() * 2 : height[0] + random() * height[1]
    const rock = crag(bedrock, x, CLIFF_Z - random() * 6, top, 3.2 + random() * 2.6, 3.5 + random() * 2, random() * Math.PI, pick(random, rockColors))
    rocks.add(rock)
    const trees = random() > 0.4 ? 1 + Math.floor(random() * 2) : 0
    for (let i = 0; i < trees; i++) {
      const size = 0.9 + random() * 0.7
      const foot = onRidge(rock, random() * 1.2 - 0.6)
      const ry = random() * Math.PI
      if (pine) pines.add({ x: foot.x, y: top + size * 0.9, z: foot.z, sx: size * 0.65, sy: size * 2.6, sz: size * 0.65, ry })
    }
    if (random() > 0.55) {
      const size = 1.2 + random() * 1.6
      boulders.add({ x: x + random() * 2, y: style.surface + 0.3, z: CLIFF_Z + 6 + random() * 6, sx: size * 1.3, sy: size * 0.7, sz: size, ry: random() * Math.PI })
    }
  }
  const cave = source === 'cave'
  for (const spot of spots) {
    for (let i = -1; i <= 1; i++) {
      const x = spot.x + i * spot.width * 0.36
      rocks.add(crag(bedrock, x, FALL_Z - 3.2, spot.top + (cave ? CAVE_WALL : -0.3), spot.width * 0.42, 2.6, (random() - 0.5) * 0.5, pick(random, wet)))
      if (!cave) continue
      const side = i !== 0
      rocks.add({
        x: spot.x + i * spot.width * 0.4,
        y: spot.top + (side ? -0.1 : 0.45),
        z: FALL_Z + 0.7,
        sx: spot.width * (side ? 0.24 : 0.3),
        sy: side ? 1.3 : 0.95,
        sz: 1.5,
        ry: (random() - 0.5) * 0.4,
        color: pick(random, wet),
      })
    }
  }
  const far = new Batch(new IcosahedronGeometry(1, 0), lowPoly(farColor))
  for (let x = left - 30; x < right + 30; x += 8 + random() * 8) {
    const half = farHeight[0] + random() * farHeight[1]
    far.add({ x, y: bedrock + half, z: -66 - random() * 8, sx: 6 + random() * 4, sy: half, sz: 5, ry: random() * Math.PI })
  }
  const objects = [rocks.build(), boulders.build(), far.build()]
  if (pine) objects.splice(1, 0, pines.build())
  return objects
}

export function buildCanyon(random: () => number, left: number, right: number, spots: FallSpot[], style: CanyonStyle): Scenery {
  const dot = createSoftDotTexture()
  const falls = spots.map((spot) => new Fall(spot, random, dot, style))
  const foam = style.foam ? new Foam(spots.flatMap((spot) => foamPuffs(random, spot, style.surface)), style.foam) : null
  const sea = new Sea(left, right, style.surface, style.sea)
  const objects = [sea.mesh, ...createCliffs(random, left, right, spots, style), ...falls.map((fall) => fall.group)]
  return {
    objects: foam ? [...objects, foam.mesh] : objects,
    animated: foam ? [sea, foam, ...falls] : [sea, ...falls],
  }
}

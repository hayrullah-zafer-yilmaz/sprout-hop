import {
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  IcosahedronGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { outline, skin } from './heroKit'
import { createRandom, getBrickTexture } from './textures'

type Vec3 = [number, number, number]

const UP = new Vector3(0, 1, 0)

function merged(parts: BufferGeometry[]): BufferGeometry {
  const geometry = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  if (!geometry) throw new Error('Geometries could not be merged')
  return geometry
}

function tinted(geometry: BufferGeometry, color: string | ((y: number) => Color)): BufferGeometry {
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  const flat = typeof color === 'string' ? new Color(color) : null
  for (let i = 0; i < position.count; i++) {
    const value = flat ?? (color as (y: number) => Color)(position.getY(i))
    colors.set([value.r, value.g, value.b], i * 3)
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

function aimed(geometry: BufferGeometry, direction: Vector3, at: Vector3): BufferGeometry {
  return geometry.applyQuaternion(new Quaternion().setFromUnitVectors(UP, direction)).translate(at.x, at.y, at.z)
}

function heartGeometry(): BufferGeometry {
  const shape = new Shape()
  shape.moveTo(5, 5)
  shape.bezierCurveTo(5, 5, 4, 0, 0, 0)
  shape.bezierCurveTo(-6, 0, -6, 7, -6, 7)
  shape.bezierCurveTo(-6, 11, -3, 15.4, 5, 19)
  shape.bezierCurveTo(12, 15.4, 16, 11, 16, 7)
  shape.bezierCurveTo(16, 7, 16, 0, 10, 0)
  shape.bezierCurveTo(7, 0, 5, 5, 5, 5)
  const geometry = new ExtrudeGeometry(shape, {
    depth: 4,
    bevelEnabled: true,
    bevelSize: 1,
    bevelThickness: 1,
    bevelSegments: 2,
    curveSegments: 10,
  })
  return geometry.center().rotateZ(Math.PI).scale(0.032, 0.032, 0.032)
}

export const coinParts = {
  rim: new CylinderGeometry(0.3, 0.3, 0.08, 24).rotateX(Math.PI / 2),
  face: new CylinderGeometry(0.19, 0.19, 0.1, 20).rotateX(Math.PI / 2),
  gold: new MeshStandardMaterial({ color: '#ffc531', metalness: 0.15, roughness: 0.35, emissive: '#a86400', emissiveIntensity: 0.55 }),
  goldLight: new MeshStandardMaterial({ color: '#ffe48a', metalness: 0.1, roughness: 0.4, emissive: '#a87400', emissiveIntensity: 0.5 }),
}

export const heartParts = {
  geometry: heartGeometry(),
  material: new MeshStandardMaterial({ color: '#ff5d73', roughness: 0.35, emissive: '#7f1d2d', emissiveIntensity: 0.5 }),
}

export const debrisParts = {
  geometry: new BoxGeometry(0.42, 0.42, 0.42),
  material: new MeshStandardMaterial({ map: getBrickTexture(), roughness: 0.9 }),
}

export const spikeParts = {
  cone: new ConeGeometry(0.11, 0.42, 6).translate(0, 0.21, 0),
  plate: new BoxGeometry(1, 0.08, 1.5).translate(0, 0.04, 0),
  steel: new MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.55, roughness: 0.3, flatShading: true }),
  base: new MeshStandardMaterial({ color: '#475569', roughness: 0.7 }),
}

const SLUG = { skin: '#9461f2', spot: '#5a2cb3', foot: '#cdb6ff', eye: '#ffffff', pupil: '#1e1b4b', shade: '#3b1f7a', rim: '#ece2ff' }
const SLUG_BODY = { center: [0.02, 0.19, 0] as Vec3, radii: [0.36, 0.2, 0.22] as Vec3 }
const SLUG_MANTLE = { center: [0.08, 0.3, 0] as Vec3, radii: [0.22, 0.15, 0.2] as Vec3 }
const SLUG_SPOTS = [
  { on: SLUG_MANTLE, phi: 0.45, theta: 0.7, size: 0.05 },
  { on: SLUG_MANTLE, phi: 0.8, theta: 2.1, size: 0.042 },
  { on: SLUG_MANTLE, phi: 0.95, theta: 1.2, size: 0.034 },
  { on: SLUG_BODY, phi: 0.95, theta: 2.55, size: 0.046 },
  { on: SLUG_BODY, phi: 1.15, theta: 2.95, size: 0.034 },
]
const STALK_PIVOT: Vec3 = [0.3, 0.36, 0]

function blob(radii: Vec3, center: Vec3, color: string, widthSegments = 28, heightSegments = 18): BufferGeometry {
  return tinted(new SphereGeometry(1, widthSegments, heightSegments).scale(...radii).translate(...center), color)
}

function spotOn({ center, radii }: typeof SLUG_BODY, phi: number, theta: number, size: number): BufferGeometry {
  const [a, b, c] = radii
  const offset = new Vector3(a * Math.sin(phi) * Math.cos(theta), b * Math.cos(phi), c * Math.sin(phi) * Math.sin(theta))
  const normal = new Vector3(offset.x / (a * a), offset.y / (b * b), offset.z / (c * c)).normalize()
  const point = offset.add(new Vector3(...center)).addScaledVector(normal, 0.004)
  return tinted(aimed(new SphereGeometry(1, 10, 6).scale(size, size * 0.3, size), normal, point), SLUG.spot)
}

function slugBody(spotted: boolean): BufferGeometry {
  const spots = spotted ? SLUG_SPOTS.flatMap(({ on, phi, theta, size }) => [spotOn(on, phi, theta, size), spotOn(on, phi, -theta, size)]) : []
  return merged([
    blob(SLUG_BODY.radii, SLUG_BODY.center, SLUG.skin),
    blob([0.27, 0.11, 0.16], [-0.3, 0.11, 0], SLUG.skin),
    blob(SLUG_MANTLE.radii, SLUG_MANTLE.center, SLUG.skin),
    blob([0.15, 0.145, 0.15], [0.3, 0.25, 0], SLUG.skin),
    blob([0.5, 0.05, 0.26], [-0.02, 0.05, 0], SLUG.foot),
    ...[-1, 1].map((side) => blob([0.05, 0.028, 0.028], [0.44, 0.18, side * 0.06], SLUG.skin, 10, 8)),
    ...spots,
  ])
}

function slugStalks(): BufferGeometry {
  return merged(
    [-1, 1].flatMap((side) => {
      const base = new Vector3(0.02, 0, side * 0.065)
      const direction = new Vector3(0.32, 1, side * 0.3).normalize()
      const eye = base.clone().addScaledVector(direction, 0.27)
      const look = new Vector3(0.85, 0.1, side * 0.5).normalize()
      const pupil = eye.clone().addScaledVector(look, 0.045)
      const glint = pupil.clone().addScaledVector(look, 0.03).add(new Vector3(0, 0.014, 0))
      return [
        tinted(aimed(new CylinderGeometry(0.02, 0.028, 0.24, 8).translate(0, 0.12, 0), direction, base), SLUG.skin),
        tinted(new SphereGeometry(0.068, 16, 12).translate(eye.x, eye.y, eye.z), SLUG.eye),
        tinted(new SphereGeometry(0.036, 12, 8).translate(pupil.x, pupil.y, pupil.z), SLUG.pupil),
        tinted(new SphereGeometry(0.012, 8, 6).translate(glint.x, glint.y, glint.z), SLUG.eye),
      ]
    }),
  )
}

export const slugParts = {
  body: slugBody(true),
  hull: slugBody(false),
  stalks: slugStalks(),
  stalkPivot: STALK_PIVOT,
  skin: skin('#ffffff', SLUG.rim, { vertexColors: true, emissiveIntensity: 0, roughness: 0.26 }),
  outline: outline(SLUG.shade, 0.012),
  fineOutline: outline(SLUG.shade, 0.008),
}

const BURR = { body: '#8a5a2e', base: '#a8743c', tip: '#f5e6b8', shade: '#3a2410', rim: '#ffe9c4', eye: '#ffffff', pupil: '#1a1208', ink: '#2a1a0c' }
const BURR_RADIUS = 0.27
const THORNS = { count: 40, length: 0.22, radius: 0.036, front: 0.55 }

function burrPod(): BufferGeometry {
  const base = new Color(BURR.base)
  const tip = new Color(BURR.tip)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const thorns: BufferGeometry[] = []
  for (let i = 0; i < THORNS.count; i++) {
    const y = 1 - ((i + 0.5) * 2) / THORNS.count
    const ring = Math.sqrt(1 - y * y)
    const direction = new Vector3(Math.cos(i * golden) * ring, y, Math.sin(i * golden) * ring)
    if (direction.z > THORNS.front) continue
    const cone = new ConeGeometry(THORNS.radius, THORNS.length, 6).translate(0, THORNS.length / 2, 0).toNonIndexed()
    tinted(cone, (h) => new Color().lerpColors(base, tip, Math.min(1, Math.max(0, h / THORNS.length - 0.25) * 1.6)))
    thorns.push(aimed(cone, direction, direction.clone().multiplyScalar(BURR_RADIUS * 0.9)))
  }
  return merged([tinted(new SphereGeometry(BURR_RADIUS, 22, 16).toNonIndexed(), BURR.body), ...thorns])
}

function burrFace(): BufferGeometry {
  const z = 0.255
  return merged([
    ...[-1, 1].flatMap((side) => [
      tinted(new SphereGeometry(0.072, 16, 12).scale(1, 1.12, 0.62).translate(side * 0.1, 0.05, z), BURR.eye),
      tinted(new SphereGeometry(0.036, 12, 8).scale(1, 1.1, 0.6).translate(side * 0.085, 0.035, z + 0.04), BURR.pupil),
      tinted(new BoxGeometry(0.15, 0.04, 0.035).rotateZ(side * 0.42).translate(side * 0.1, 0.155, z + 0.03), BURR.ink),
    ]),
    tinted(new TorusGeometry(0.05, 0.013, 6, 14, Math.PI).translate(0, -0.1, z + 0.025), BURR.ink),
  ])
}

export const burrParts = {
  rollHeight: 0.42,
  pod: burrPod(),
  face: burrFace(),
  skin: skin('#ffffff', BURR.rim, { vertexColors: true, emissiveIntensity: 0, roughness: 0.55 }),
  faceSkin: skin('#ffffff', '#ffffff', { vertexColors: true, emissiveIntensity: 0, roughness: 0.35 }),
  outline: outline(BURR.shade, 0.009),
}

function boulder(radius: number, seed: number): BufferGeometry {
  const geometry = new IcosahedronGeometry(radius, 1)
  const random = createRandom(seed)
  const position = geometry.attributes.position
  const point = new Vector3()
  const offsets = new Map<string, number>()
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i)
    const key = `${point.x.toFixed(4)},${point.y.toFixed(4)},${point.z.toFixed(4)}`
    let offset = offsets.get(key)
    if (offset === undefined) {
      offset = 0.82 + random() * 0.32
      offsets.set(key, offset)
    }
    point.multiplyScalar(offset)
    position.setXYZ(i, point.x, point.y, point.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

function shadowTexture(): CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.75)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export const rockParts = {
  body: boulder(0.52, 7),
  rubble: boulder(0.17, 11),
  basalt: new MeshStandardMaterial({ color: '#5a4b47', roughness: 0.85, flatShading: true, emissive: '#ff4a0a', emissiveIntensity: 0.12 }),
  shadow: new CircleGeometry(0.62, 32).rotateX(-Math.PI / 2),
  shade: new MeshBasicMaterial({
    color: '#000000',
    map: shadowTexture(),
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  }),
  puff: new IcosahedronGeometry(0.3, 1),
  dust: new MeshStandardMaterial({ color: '#8a7f7a', roughness: 1, flatShading: true }),
}

export const lavaParts = {
  drop: new IcosahedronGeometry(0.11, 0),
  molten: new MeshBasicMaterial({ color: '#ffb347' }),
}

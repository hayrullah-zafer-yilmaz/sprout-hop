import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  IcosahedronGeometry,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  Shape,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { getTileTextures } from './textures'

type Vec3 = [number, number, number]

interface Placement {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

function placed(geometry: BufferGeometry, { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }: Placement): BufferGeometry {
  const matrix = new Matrix4().compose(
    new Vector3(...position),
    new Quaternion().setFromEuler(new Euler(...rotation)),
    new Vector3(...scale),
  )
  return geometry.applyMatrix4(matrix)
}

function merged(parts: BufferGeometry[]): BufferGeometry {
  const geometry = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  if (!geometry) throw new Error('Geometries could not be merged')
  return geometry
}

function mirrored(make: () => BufferGeometry, { position = [0, 0, 0], rotation = [0, 0, 0], scale }: Placement): BufferGeometry {
  const [x, y, z] = position
  const [rx, ry, rz] = rotation
  return merged([
    placed(make(), { position: [-x, y, z], rotation: [rx, -ry, -rz], scale }),
    placed(make(), { position: [x, y, z], rotation, scale }),
  ])
}

function spikeBall(): BufferGeometry {
  const cone = () => new ConeGeometry(0.1, 0.3, 6)
  const ring = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2
    return placed(cone(), { position: [Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0], rotation: [0, 0, angle - Math.PI / 2] })
  })
  const front = placed(cone(), { position: [0, 0, 0.4], rotation: [Math.PI / 2, 0, 0] })
  const back = placed(cone(), { position: [0, 0, -0.4], rotation: [-Math.PI / 2, 0, 0] })
  return merged([...ring, front, back])
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

const eyeWhite = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })

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
  material: new MeshStandardMaterial({ map: getTileTextures().brick, roughness: 0.9 }),
}

export const spikeParts = {
  cone: new ConeGeometry(0.11, 0.42, 6).translate(0, 0.21, 0),
  plate: new BoxGeometry(1, 0.08, 1.5).translate(0, 0.04, 0),
  steel: new MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.55, roughness: 0.3, flatShading: true }),
  base: new MeshStandardMaterial({ color: '#475569', roughness: 0.7 }),
}

export const slimeParts = {
  body: placed(new SphereGeometry(0.45, 24, 16), { position: [0, 0.32, 0], scale: [1.05, 0.75, 0.95] }),
  shine: placed(new SphereGeometry(0.08, 10, 8), { position: [-0.17, 0.5, 0.2], scale: [1, 0.6, 0.6] }),
  eyes: mirrored(() => new SphereGeometry(0.095, 14, 10), { position: [0.14, 0.42, 0.32] }),
  pupils: mirrored(() => new SphereGeometry(0.045, 10, 8), { position: [0.12, 0.41, 0.405] }),
  skin: new MeshStandardMaterial({ color: '#8b5cf6', roughness: 0.25, emissive: '#2e1065', emissiveIntensity: 0.35 }),
  gloss: new MeshBasicMaterial({ color: '#ede9fe' }),
  eyeWhite,
  pupil: new MeshBasicMaterial({ color: '#1e1b4b' }),
}

export const spikyParts = {
  rollHeight: 0.42,
  body: new IcosahedronGeometry(0.36, 1),
  spikes: spikeBall(),
  eyes: mirrored(() => new SphereGeometry(0.085, 12, 8), { position: [0.13, 0.5, 0.31] }),
  pupils: mirrored(() => new SphereGeometry(0.04, 10, 8), { position: [0.12, 0.49, 0.39] }),
  brows: mirrored(() => new BoxGeometry(0.16, 0.035, 0.03), { position: [0.13, 0.62, 0.33], rotation: [0, 0, 0.45] }),
  shell: new MeshStandardMaterial({ color: '#334155', roughness: 0.6, flatShading: true }),
  spike: new MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4, flatShading: true }),
  eyeWhite,
  pupil: new MeshBasicMaterial({ color: '#dc2626' }),
  brow: new MeshBasicMaterial({ color: '#0f172a' }),
}

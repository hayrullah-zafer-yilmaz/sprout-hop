import {
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { BODY_TOP, HERO, HERO_LOOKS, bodyRadiusAt } from './hero'
import { createRandom } from './textures'
import { outline, skin, withRim } from './heroKit'

type Vec3 = [number, number, number]

export interface Mount {
  position: Vec3
  rotation: Vec3
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  draw(ctx)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function surfaceMount(x: number, y: number, lift: number): Mount {
  const r = bodyRadiusAt(y)
  const point = new Vector3(x, y, Math.sqrt(Math.max(r * r - x * x, 0)))
  const normal = new Vector3(point.x, point.y - HERO.center, point.z).normalize()
  point.addScaledVector(normal, lift)
  const euler = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal))
  return { position: [point.x, point.y, point.z], rotation: [euler.x, euler.y, euler.z] }
}

function leafGeometry(length: number, width: number): BufferGeometry {
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.bezierCurveTo(length * 0.22, width * 0.62, length * 0.72, width * 0.58, length, 0)
  shape.bezierCurveTo(length * 0.72, -width * 0.52, length * 0.22, -width * 0.56, 0, 0)
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.01,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 16,
  })
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const t = position.getX(i) / length
    const across = position.getY(i)
    position.setZ(i, position.getZ(i) - 0.005 + t * t * 0.05 + across * across * 1.6)
  }
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

function sweptSpike(height: number, radius: number): BufferGeometry {
  const geometry = new ConeGeometry(radius, height, 12, 8).translate(0, height / 2, 0)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const t = position.getY(i) / height
    position.setZ(i, position.getZ(i) - t * t * height * 0.6)
  }
  geometry.computeVertexNormals()
  return geometry
}

function fluffBall(radius: number, seed: number): BufferGeometry {
  const geometry = new IcosahedronGeometry(radius, 2)
  const random = createRandom(seed)
  const position = geometry.attributes.position
  const point = new Vector3()
  const offsets = new Map<string, number>()
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i)
    const key = `${point.x.toFixed(4)},${point.y.toFixed(4)},${point.z.toFixed(4)}`
    let offset = offsets.get(key)
    if (offset === undefined) {
      offset = 1 + (random() - 0.5) * 0.28
      offsets.set(key, offset)
    }
    point.multiplyScalar(offset)
    position.setXYZ(i, point.x, point.y, point.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

function knit(base: string, rib: string): CanvasTexture {
  return canvasTexture(32, 32, (ctx) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = rib
    for (const x of [0, 16]) {
      for (let y = 0; y < 32; y += 8) {
        ctx.beginPath()
        ctx.moveTo(x + 2, y)
        ctx.lineTo(x + 8, y + 6)
        ctx.lineTo(x + 14, y)
        ctx.lineTo(x + 14, y + 3)
        ctx.lineTo(x + 8, y + 9)
        ctx.lineTo(x + 2, y + 3)
        ctx.closePath()
        ctx.fill()
      }
    }
  })
}

function lensTexture(): CanvasTexture {
  return canvasTexture(128, 128, (ctx) => {
    const glass = ctx.createRadialGradient(54, 50, 6, 64, 64, 64)
    glass.addColorStop(0, '#c3fbf1')
    glass.addColorStop(0.55, '#3ad6c0')
    glass.addColorStop(1, '#0d6b63')
    ctx.fillStyle = glass
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.beginPath()
    ctx.moveTo(26, 70)
    ctx.lineTo(70, 22)
    ctx.lineTo(86, 30)
    ctx.lineTo(40, 82)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(88, 86, 7, 0, Math.PI * 2)
    ctx.fill()
  })
}

function knitted(texture: CanvasTexture, repeatU: number, repeatV: number): MeshStandardMaterial {
  const map = texture.clone()
  map.wrapS = RepeatWrapping
  map.wrapT = RepeatWrapping
  map.repeat.set(repeatU, repeatV)
  map.needsUpdate = true
  return withRim(new MeshStandardMaterial({ map, roughness: 0.9, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.08 }), '#e3eeff', 0.3)
}

function lazy<T>(make: () => T): () => T {
  let value: T | undefined
  return () => (value ??= make())
}

export const SCARF_Y = HERO.center - 0.24
const SCARF_RADIUS = bodyRadiusAt(SCARF_Y) + 0.014
const BAND_Y = HERO.center + 0.2
const BAND_HEIGHT = 0.078

export const getSproutGear = lazy(() => {
  const wool = knit('#2f6fde', '#2659bd')
  const knotAngle = Math.PI * 0.78
  return {
    leaf: leafGeometry(0.17, 0.086),
    leafSkin: skin('#53cf5f', '#eaffd9'),
    leafOutline: outline('#1d6a2b', 0.006),
    stem: new CylinderGeometry(0.016, 0.024, 0.12, 8).translate(0, 0.06, 0),
    stemSkin: skin('#2f9e44', '#d8ffd0'),
    scarf: new TorusGeometry(SCARF_RADIUS, 0.036, 10, 56),
    scarfSkin: knitted(wool, 28, 2),
    scarfOutline: outline('#163a80', 0.007),
    knot: new SphereGeometry(0.058, 18, 12),
    knotSkin: knitted(wool, 3, 2),
    knotPosition: [Math.sin(knotAngle) * SCARF_RADIUS, SCARF_Y, Math.cos(knotAngle) * SCARF_RADIUS] as Vec3,
    tail: new RoundedBoxGeometry(0.1, 0.2, 0.034, 3, 0.014).translate(0, -0.1, 0),
    tailSkin: knitted(wool, 2, 4),
    sproutY: BODY_TOP - 0.025,
  }
})

export const getZipGear = lazy(() => {
  const rTop = bodyRadiusAt(BAND_Y + BAND_HEIGHT / 2) + 0.008
  const rBottom = bodyRadiusAt(BAND_Y - BAND_HEIGHT / 2) + 0.008
  const lens = lensTexture()
  return {
    band: new CylinderGeometry(rTop, rBottom, BAND_HEIGHT, 64, 1, true),
    bandY: BAND_Y,
    strap: skin('#334155', '#c7d2fe', { roughness: 0.78, emissiveIntensity: 0.04, side: DoubleSide }),
    strapOutline: outline('#0f172a', 0.006),
    cup: new CylinderGeometry(0.084, 0.092, 0.05, 28, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.025),
    rim: new TorusGeometry(0.083, 0.02, 10, 32).translate(0, 0, 0.05),
    lens: new CircleGeometry(0.076, 32).translate(0, 0, 0.044),
    metal: skin('#4b5563', '#e2e8f0', { roughness: 0.38, metalness: 0.2, emissiveIntensity: 0.05, side: DoubleSide }),
    glass: withRim(
      new MeshStandardMaterial({ map: lens, emissiveMap: lens, emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.1 }),
      '#ffffff',
      0.2,
    ),
    goggles: [-0.118, 0.118].map((x) => surfaceMount(x, BAND_Y + 0.004, 0.006)),
    spike: sweptSpike(0.24, 0.058),
    spikeSkin: skin('#f5b301', '#fff3bf'),
    spikeOutline: outline(HERO_LOOKS.zip.shade, 0.007),
    tuftY: BODY_TOP - 0.06,
  }
})

export const getBunGear = lazy(() => {
  const { body, rim, shade } = HERO_LOOKS.bun
  return {
    ear: new CapsuleGeometry(0.074, 0.2, 6, 16).translate(0, 0.174, 0),
    earTip: new CapsuleGeometry(0.068, 0.12, 6, 16).translate(0, 0.128, 0),
    inner: new CapsuleGeometry(0.04, 0.17, 4, 12).translate(0, 0.16, 0),
    innerTip: new CapsuleGeometry(0.036, 0.09, 4, 12).translate(0, 0.11, 0),
    fur: skin(body, rim),
    pink: skin('#ffb0c7', '#fff0f5', { roughness: 0.62 }),
    furOutline: outline(shade, 0.008),
    tail: fluffBall(0.1, 31),
    tailSkin: skin('#ffffff', '#ffffff', { flatShading: true, roughness: 0.9 }),
    earY: HERO.center + 0.3,
  }
})

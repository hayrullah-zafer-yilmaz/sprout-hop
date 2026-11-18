import {
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Shape,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import { POT, SOIL_TOP } from './hero'
import { outline, skin, withRim } from './heroKit'

type Vec3 = [number, number, number]

export interface Mount {
  position: Vec3
  rotation: Vec3
}

interface LeafColors {
  base: string
  edge: string
  vein: string
  rim: string
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

function collarMount(x: number, y: number, lift: number, tilt: number): Mount {
  const radius = POT.collar.radius + lift
  const z = Math.sqrt(Math.max(radius * radius - x * x, 0))
  const facing = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(x, 0, z).normalize())
  const pitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -tilt)
  const euler = new Euler().setFromQuaternion(facing.multiply(pitch))
  return { position: [x, y, z], rotation: [euler.x, euler.y, euler.z] }
}

interface LeafForm {
  length: number
  width: number
  cup: number
  curl: number
  facing: number
  rounded?: boolean
}

function leafShape(length: number, width: number, rounded: boolean): Shape {
  const shape = new Shape()
  shape.moveTo(0, 0)
  if (rounded) {
    shape.bezierCurveTo(length * 0.12, width * 0.5, length * 0.5, width * 0.62, length * 0.8, width * 0.42)
    shape.quadraticCurveTo(length, width * 0.24, length, 0)
    shape.quadraticCurveTo(length, -width * 0.24, length * 0.8, -width * 0.42)
    shape.bezierCurveTo(length * 0.5, -width * 0.62, length * 0.12, -width * 0.5, 0, 0)
    return shape
  }
  shape.bezierCurveTo(length * 0.22, width * 0.62, length * 0.72, width * 0.58, length, 0)
  shape.bezierCurveTo(length * 0.72, -width * 0.52, length * 0.22, -width * 0.56, 0, 0)
  return shape
}

function leafGeometry({ length, width, cup, curl, facing, rounded = false }: LeafForm): BufferGeometry {
  const shape = leafShape(length, width, rounded)
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 18,
  })
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < position.count; i++) {
    const along = position.getX(i) / length
    const across = position.getY(i)
    uv.setXY(i, along, 0.5 + across / width)
    position.setZ(i, position.getZ(i) - 0.006 + along * along * curl + across * across * cup)
  }
  geometry.rotateX(-facing)
  geometry.computeVertexNormals()
  return geometry
}

function leafTexture({ base, edge, vein }: LeafColors): CanvasTexture {
  return canvasTexture(128, 64, (ctx) => {
    const shade = ctx.createLinearGradient(0, 0, 0, 64)
    shade.addColorStop(0, edge)
    shade.addColorStop(0.5, base)
    shade.addColorStop(1, edge)
    ctx.fillStyle = shade
    ctx.fillRect(0, 0, 128, 64)
    ctx.strokeStyle = vein
    ctx.lineCap = 'round'
    ctx.lineWidth = 3.2
    ctx.beginPath()
    ctx.moveTo(2, 32)
    ctx.lineTo(118, 32)
    ctx.stroke()
    ctx.lineWidth = 1.8
    for (let i = 0; i < 5; i++) {
      const x = 14 + i * 21
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(x, 32)
        ctx.quadraticCurveTo(x + 9, 32 + side * 9, x + 17, 32 + side * 19)
        ctx.stroke()
      }
    }
  })
}

function leafSkin(colors: LeafColors): MeshStandardMaterial {
  const map = leafTexture(colors)
  return withRim(new MeshStandardMaterial({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.1, roughness: 0.5 }), colors.rim, 0.3)
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

function lazy<T>(make: () => T): () => T {
  let value: T | undefined
  return () => (value ??= make())
}

const LEAF_OUTLINE = '#1d6a2b'
const STRAP_Y = (POT.collar.bottom + POT.collar.top) / 2

export const getSproutGear = lazy(() => ({
  leaf: leafGeometry({ length: 0.47, width: 0.28, cup: 1.4, curl: -0.06, facing: 0.55 }),
  leafSkin: leafSkin({ base: '#7bdc5e', edge: '#3f9f3c', vein: '#c4f59a', rim: '#eaffd9' }),
  leafOutline: outline(LEAF_OUTLINE, 0.007),
  stem: new CylinderGeometry(0.024, 0.034, 0.17, 10).translate(0, 0.085, 0),
  stemSkin: skin('#3fa34d', '#d8ffd0'),
  sproutY: SOIL_TOP - 0.03,
  leafY: 0.155,
}))

export const getZipGear = lazy(() => {
  const radius = POT.collar.radius + 0.008
  const lens = lensTexture()
  return {
    band: new CylinderGeometry(radius, radius, 0.06, 64, 1, true),
    bandY: STRAP_Y,
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
    goggles: [-0.135, 0.135].map((x) => collarMount(x, STRAP_Y + 0.004, 0.012, 0.32)),
    blade: leafGeometry({ length: 0.42, width: 0.13, cup: 0.8, curl: 0.05, facing: Math.PI / 2 }),
    bladeSkin: leafSkin({ base: '#8be05a', edge: '#4aa83a', vein: '#d6f7a4', rim: '#f4ffd9' }),
    bladeOutline: outline(LEAF_OUTLINE, 0.006),
    tuftY: SOIL_TOP - 0.03,
  }
})

export const getBunGear = lazy(() => ({
  ear: leafGeometry({ length: 0.5, width: 0.2, cup: 2.2, curl: 0.09, facing: 0.2, rounded: true }),
  earSkin: leafSkin({ base: '#a6dc92', edge: '#6fb565', vein: '#e2f8d2', rim: '#f4ffee' }),
  earOutline: outline('#4a8544', 0.008),
  earY: SOIL_TOP - 0.04,
}))

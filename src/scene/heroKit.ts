import {
  BackSide,
  BufferAttribute,
  Color,
  CylinderGeometry,
  LatheGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type MeshStandardMaterialParameters,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { CharacterId } from '../game/characters'
import { BELLY, FACE, HERO, HERO_LOOKS, POT, bodyPoint, bodyRadiusAt, type HeroLook } from './hero'
import { getFaceAtlas, type FaceAtlas } from './heroFace'
import { createRandom } from './textures'

const PROFILE_STEPS = 32
const BODY_SEGMENTS = 48
const CORNER_STEPS = 5
const FACE_LIFT = 0.004
const SKIN = { roughness: 0.56, lift: 0.1, rim: 0.42 }
const OUTLINE = { body: 0.013, part: 0.009 }

export interface HeroKit {
  look: HeroLook
  atlas: FaceAtlas
  body: MeshStandardMaterial
  collar: MeshStandardMaterial
  soil: MeshStandardMaterial
  limbs: MeshStandardMaterial
  face: MeshStandardMaterial
  shoe: BufferGeometry
  shoeSkin: MeshStandardMaterial
  outline: MeshBasicMaterial
  fineOutline: MeshBasicMaterial
}

export const bodyGeometry = new LatheGeometry(
  [
    new Vector2(0, POT.base),
    ...Array.from({ length: PROFILE_STEPS + 1 }, (_, i) => {
      const { r, y } = bodyPoint(BELLY.from + ((BELLY.to - BELLY.from) * i) / PROFILE_STEPS)
      return new Vector2(r, y)
    }),
  ],
  BODY_SEGMENTS,
)

export const collarGeometry = new LatheGeometry(collarProfile(), BODY_SEGMENTS)

export const soilGeometry = createSoilGeometry()

export const faceGeometry = createFaceGeometry()

export const armGeometry = new SphereGeometry(0.1, 20, 14)

const skins = new Map<string, MeshStandardMaterial>()
const outlines = new Map<string, MeshBasicMaterial>()
const kits = new Map<CharacterId, HeroKit>()

function collarProfile(): Vector2[] {
  const { bottom, top, radius, lip, round } = POT.collar
  const points: Vector2[] = []
  const corner = (cx: number, cy: number, from: number) => {
    for (let i = 0; i <= CORNER_STEPS; i++) {
      const angle = from + (i / CORNER_STEPS) * (Math.PI / 2)
      points.push(new Vector2(cx + Math.cos(angle) * round, cy + Math.sin(angle) * round))
    }
  }
  corner(lip - 0.02 + round, bottom + round, Math.PI)
  corner(radius - round, bottom + round, -Math.PI / 2)
  corner(radius - round, top - round, 0)
  corner(lip + round, top - round, Math.PI / 2)
  points.push(new Vector2(lip, top - 0.08))
  return points
}

function createSoilGeometry(): BufferGeometry {
  const { lip } = POT.collar
  const geometry = new SphereGeometry(lip + 0.004, 28, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  geometry.scale(1, POT.soil.height, 1).translate(0, POT.soil.y, 0)
  const random = createRandom(17)
  const position = geometry.attributes.position
  const offsets = new Map<string, number>()
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    if (y - POT.soil.y < 0.01) continue
    const key = `${x.toFixed(4)},${z.toFixed(4)}`
    let offset = offsets.get(key)
    if (offset === undefined) {
      offset = (random() - 0.5) * 0.022
      offsets.set(key, offset)
    }
    position.setY(i, y + offset)
  }
  geometry.computeVertexNormals()
  return geometry
}

function createFaceGeometry(): BufferGeometry {
  const geometry = new PlaneGeometry(FACE.width, FACE.height, 36, 22)
  const position = geometry.attributes.position as BufferAttribute
  const point = new Vector3()
  const normal = new Vector3()
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) + HERO.center + FACE.y
    const r = bodyRadiusAt(y)
    const x = Math.max(-r, Math.min(r, position.getX(i)))
    point.set(x, y, Math.sqrt(Math.max(r * r - x * x, 0)))
    normal.set(point.x, point.y - HERO.center, point.z).normalize()
    point.addScaledVector(normal, FACE_LIFT)
    position.setXYZ(i, point.x, point.y, point.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

function paint(geometry: BufferGeometry, pick: (x: number, y: number, z: number) => string): BufferGeometry {
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  const color = new Color()
  for (let i = 0; i < position.count; i++) {
    color.set(pick(position.getX(i), position.getY(i), position.getZ(i)))
    colors.set([color.r, color.g, color.b], i * 3)
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

function createShoe(look: HeroLook): BufferGeometry {
  const { shoe } = look
  const upper = new SphereGeometry(0.12, 24, 14).scale(1, 0.7, 1.38).translate(0, 0.068, 0.012)
  const sole = new CylinderGeometry(0.124, 0.127, 0.042, 24).scale(1, 1, 1.4).translate(0, 0.021, 0.014)
  paint(upper, (_, y, z) => ((shoe.zone === 'toe' ? z > 0.1 : y > 0.124) ? shoe.accent : shoe.upper))
  paint(sole, () => shoe.sole)
  const geometry = mergeGeometries([upper, sole])
  upper.dispose()
  sole.dispose()
  if (!geometry) throw new Error('Shoe geometry could not be merged')
  return geometry
}

export function withRim<T extends MeshStandardMaterial>(material: T, color: string, strength = SKIN.rim): T {
  const rimColor = new Color(color)
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: rimColor }
    shader.uniforms.rimStrength = { value: strength }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimStrength;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\nfloat rimFactor = 1.0 - saturate(dot(normalize(vViewPosition), normal));\ntotalEmissiveRadiance += rimColor * rimStrength * pow(rimFactor, 3.0);',
      )
  }
  return material
}

export function skin(color: string, rim: string, options: MeshStandardMaterialParameters = {}): MeshStandardMaterial {
  const key = `${color}|${rim}|${JSON.stringify(options)}`
  let material = skins.get(key)
  if (!material) {
    material = withRim(
      new MeshStandardMaterial({ color, roughness: SKIN.roughness, emissive: color, emissiveIntensity: SKIN.lift, ...options }),
      rim,
    )
    skins.set(key, material)
  }
  return material
}

export function outline(color: string, width = OUTLINE.part): MeshBasicMaterial {
  const key = `${color}|${width}`
  let material = outlines.get(key)
  if (!material) {
    material = new MeshBasicMaterial({ color, side: BackSide })
    material.onBeforeCompile = (shader) => {
      shader.uniforms.outlineWidth = { value: width }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float outlineWidth;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normal * outlineWidth;')
    }
    outlines.set(key, material)
  }
  return material
}

export function getHeroKit(id: CharacterId): HeroKit {
  const cached = kits.get(id)
  if (cached) return cached
  const look = HERO_LOOKS[id]
  const atlas = getFaceAtlas(id)
  const face = withRim(
    new MeshStandardMaterial({
      map: atlas.texture,
      emissiveMap: atlas.texture,
      emissive: '#ffffff',
      emissiveIntensity: SKIN.lift,
      roughness: SKIN.roughness,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    look.rim,
  )
  const kit: HeroKit = {
    look,
    atlas,
    body: skin(look.body, look.rim, { roughness: look.roughness }),
    collar: skin(look.collar, look.rim, { roughness: look.roughness }),
    soil: skin(look.soil, '#b0805a', { roughness: 1, flatShading: true, emissiveIntensity: 0.04 }),
    limbs: skin(look.limbs, look.rim, { roughness: look.roughness }),
    face,
    shoe: createShoe(look),
    shoeSkin: skin('#ffffff', look.rim, { vertexColors: true, emissiveIntensity: 0, roughness: 0.62 }),
    outline: outline(look.shade, OUTLINE.body),
    fineOutline: outline(look.shade, OUTLINE.part),
  }
  kits.set(id, kit)
  return kit
}

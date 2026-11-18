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
import { FACE, HERO, HERO_LOOKS, bodyPoint, bodyRadiusAt, type HeroLook } from './hero'
import { getFaceAtlas, type FaceAtlas } from './heroFace'

const PROFILE_STEPS = 32
const BODY_SEGMENTS = 48
const FACE_LIFT = 0.004
const SKIN = { roughness: 0.56, lift: 0.1, rim: 0.42 }
const OUTLINE = { body: 0.013, part: 0.009 }

export interface HeroKit {
  look: HeroLook
  atlas: FaceAtlas
  body: MeshStandardMaterial
  limbs: MeshStandardMaterial
  face: MeshStandardMaterial
  shoe: BufferGeometry
  shoeSkin: MeshStandardMaterial
  outline: MeshBasicMaterial
  fineOutline: MeshBasicMaterial
}

export const bodyGeometry = new LatheGeometry(
  Array.from({ length: PROFILE_STEPS + 1 }, (_, i) => {
    const { r, y } = bodyPoint((i / PROFILE_STEPS) * Math.PI)
    return new Vector2(r, y)
  }),
  BODY_SEGMENTS,
  Math.PI,
)

export const faceGeometry = createFaceGeometry()

export const armGeometry = new SphereGeometry(0.1, 20, 14)

const skins = new Map<string, MeshStandardMaterial>()
const outlines = new Map<string, MeshBasicMaterial>()
const kits = new Map<CharacterId, HeroKit>()

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
    body: skin(look.body, look.rim),
    limbs: skin(look.limbs, look.rim),
    face,
    shoe: createShoe(look),
    shoeSkin: skin('#ffffff', look.rim, { vertexColors: true, emissiveIntensity: 0, roughness: 0.62 }),
    outline: outline(look.shade, OUTLINE.body),
    fineOutline: outline(look.shade, OUTLINE.part),
  }
  kits.set(id, kit)
  return kit
}

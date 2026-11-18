import { DataTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from 'three'
import type { CharacterId } from '../game/characters'
import { FACE, HERO_LOOKS, type HeroLook } from './hero'

export const EXPRESSIONS = ['neutral', 'blink', 'happy', 'jump', 'hurt', 'focus', 'ko', 'wink'] as const

export type Expression = (typeof EXPRESSIONS)[number]

export interface FaceAtlas {
  texture: DataTexture
  show(expression: Expression): void
}

interface Face {
  ctx: CanvasRenderingContext2D
  look: HeroLook
  id: CharacterId
}

type Side = -1 | 1

const COLUMNS = 4
const ROWS = 2
const CELL = { width: 512, height: 320 }
const PX = CELL.width / FACE.width
const EYE = { x: 0.136, y: 0.058, rx: 0.08, ry: 0.104 }
const MOUTH_Y = -0.088
const NOSE_Y = -0.042
const CHEEK = { x: 0.238, y: -0.052, rx: 0.06, ry: 0.034 }
const LINE = 9
const SIDES: Side[] = [-1, 1]

const atlases = new Map<CharacterId, FaceAtlas>()

function px(x: number): number {
  return CELL.width / 2 + x * PX
}

function py(y: number): number {
  return CELL.height / 2 - y * PX
}

function channels(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function rgba(hex: string, alpha: number): string {
  return `rgba(${channels(hex).join(', ')}, ${alpha})`
}

function ellipse(cx: number, cy: number, rx: number, ry: number, rotation = 0): Path2D {
  const path = new Path2D()
  path.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2)
  return path
}

function eyeFrame(side: Side, scale = 1) {
  return { cx: px(side * EYE.x), cy: py(EYE.y), rx: EYE.rx * PX * scale, ry: EYE.ry * PX * scale }
}

function openEye({ ctx, look }: Face, side: Side, options: { scale?: number; lid?: boolean } = {}): void {
  const { cx, cy, rx, ry } = eyeFrame(side, options.scale)
  const white = ellipse(cx, cy, rx, ry)
  const sclera = ctx.createLinearGradient(0, cy - ry, 0, cy + ry)
  sclera.addColorStop(0, '#d5deea')
  sclera.addColorStop(0.34, '#ffffff')
  sclera.addColorStop(1, '#f2f5fa')
  ctx.fillStyle = sclera
  ctx.fill(white)

  ctx.save()
  ctx.clip(white)
  const irisY = cy + ry * 0.14
  const irx = rx * 0.78
  const iry = ry * 0.76
  const iris = ctx.createRadialGradient(cx, irisY + iry * 0.5, iry * 0.08, cx, irisY, iry * 1.05)
  iris.addColorStop(0, look.iris[0])
  iris.addColorStop(1, look.iris[1])
  ctx.fillStyle = iris
  ctx.fill(ellipse(cx, irisY, irx, iry))
  ctx.fillStyle = '#0a1020'
  ctx.fill(ellipse(cx, irisY + iry * 0.06, irx * 0.48, iry * 0.52))
  ctx.fillStyle = '#ffffff'
  ctx.fill(ellipse(cx - irx * 0.34, irisY - iry * 0.36, irx * 0.34, iry * 0.28, -0.5))
  ctx.globalAlpha = 0.9
  ctx.fill(ellipse(cx + irx * 0.38, irisY + iry * 0.46, irx * 0.15, irx * 0.15))
  ctx.globalAlpha = 1
  if (options.lid) {
    const outerY = cy - ry * 0.5
    const innerY = cy - ry * 0.12
    ctx.fillStyle = look.body
    ctx.beginPath()
    ctx.moveTo(cx - rx - 4, cy - ry - 4)
    ctx.lineTo(cx + rx + 4, cy - ry - 4)
    ctx.lineTo(cx + rx + 4, side < 0 ? innerY : outerY)
    ctx.lineTo(cx - rx - 4, side < 0 ? outerY : innerY)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  ctx.strokeStyle = look.ink
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 4
  ctx.stroke(white)
  ctx.lineWidth = LINE + 1
  if (options.lid) {
    ctx.beginPath()
    ctx.moveTo(cx + side * rx * 1.02, cy - ry * 0.5)
    ctx.lineTo(cx - side * rx * 1.02, cy - ry * 0.12)
    ctx.stroke()
    return
  }
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.9)
  ctx.stroke()
  const corner = side < 0 ? Math.PI * 1.1 : Math.PI * 1.9
  const x = cx + Math.cos(corner) * rx
  const y = cy + Math.sin(corner) * ry
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x + side * 10, y - 2, x + side * 16, y - 12)
  ctx.stroke()
}

function closedEye({ ctx, look }: Face, side: Side, mood: 'rest' | 'smile'): void {
  const { cx, cy, rx } = eyeFrame(side)
  ctx.strokeStyle = look.ink
  ctx.lineCap = 'round'
  ctx.lineWidth = LINE + (mood === 'smile' ? 3 : 1)
  ctx.beginPath()
  if (mood === 'smile') {
    ctx.moveTo(cx - rx, cy + 10)
    ctx.quadraticCurveTo(cx, cy - 30, cx + rx, cy + 10)
  } else {
    ctx.moveTo(cx - rx * 1.05, cy + 6)
    ctx.quadraticCurveTo(cx, cy + 30, cx + rx * 1.05, cy + 6)
    ctx.moveTo(cx + side * rx * 1.05, cy + 6)
    ctx.lineTo(cx + side * (rx * 1.05 + 12), cy - 4)
  }
  ctx.stroke()
}

function squintEye({ ctx, look }: Face, side: Side): void {
  const { cx, cy, rx, ry } = eyeFrame(side)
  const tip = cx - side * rx * 0.55
  const back = cx + side * rx * 0.9
  ctx.strokeStyle = look.ink
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = LINE + 2
  ctx.beginPath()
  ctx.moveTo(back, cy - ry * 0.6)
  ctx.lineTo(tip, cy)
  ctx.lineTo(back, cy + ry * 0.6)
  ctx.stroke()
}

function crossEye({ ctx, look }: Face, side: Side): void {
  const { cx, cy, rx } = eyeFrame(side)
  const r = rx * 0.75
  ctx.strokeStyle = look.ink
  ctx.lineCap = 'round'
  ctx.lineWidth = LINE + 1
  ctx.beginPath()
  ctx.moveTo(cx - r, cy - r)
  ctx.lineTo(cx + r, cy + r)
  ctx.moveTo(cx + r, cy - r)
  ctx.lineTo(cx - r, cy + r)
  ctx.stroke()
}

function cheeks({ ctx, look, id }: Face, strength = 1): void {
  for (const side of SIDES) {
    const cx = px(side * CHEEK.x)
    const cy = py(CHEEK.y)
    const rx = CHEEK.rx * PX
    const ry = CHEEK.ry * PX
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(1, ry / rx)
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
    glow.addColorStop(0, rgba(look.blush, 0.72 * strength))
    glow.addColorStop(0.55, rgba(look.blush, 0.42 * strength))
    glow.addColorStop(1, rgba(look.blush, 0))
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, rx, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    if (id !== 'zip') continue
    ctx.fillStyle = rgba('#c2620f', 0.75)
    for (const [dx, dy] of [[-12, -4], [0, 6], [12, -4]]) ctx.fill(ellipse(cx + dx * side, cy + dy, 4.5, 4.5))
  }
}

function nose({ ctx, look, id }: Face): void {
  if (id !== 'bun') return
  const cx = px(0)
  const cy = py(NOSE_Y)
  const path = new Path2D()
  path.moveTo(cx - 15, cy - 7)
  path.quadraticCurveTo(cx, cy - 14, cx + 15, cy - 7)
  path.quadraticCurveTo(cx + 13, cy + 5, cx, cy + 10)
  path.quadraticCurveTo(cx - 13, cy + 5, cx - 15, cy - 7)
  ctx.fillStyle = '#ff7ea6'
  ctx.fill(path)
  ctx.strokeStyle = look.ink
  ctx.lineWidth = 3.5
  ctx.stroke(path)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.fill(ellipse(cx - 4, cy - 5, 5, 3))
}

function smile({ ctx, look, id }: Face): void {
  const cx = px(0)
  const cy = py(MOUTH_Y)
  ctx.strokeStyle = look.ink
  ctx.lineCap = 'round'
  ctx.lineWidth = LINE - 1
  ctx.beginPath()
  if (id === 'bun') {
    ctx.moveTo(cx, cy - 18)
    ctx.lineTo(cx, cy - 6)
    ctx.moveTo(cx - 24, cy - 10)
    ctx.quadraticCurveTo(cx - 12, cy + 6, cx, cy - 6)
    ctx.quadraticCurveTo(cx + 12, cy + 6, cx + 24, cy - 10)
  } else if (id === 'zip') {
    ctx.moveTo(cx - 26, cy - 4)
    ctx.quadraticCurveTo(cx - 2, cy + 18, cx + 26, cy - 10)
  } else {
    ctx.moveTo(cx - 25, cy - 5)
    ctx.quadraticCurveTo(cx, cy + 18, cx + 25, cy - 5)
  }
  ctx.stroke()
}

function openMouth({ ctx, look }: Face, width: number, height: number, options: { teeth?: boolean; round?: boolean } = {}): void {
  const cx = px(0)
  const top = py(MOUTH_Y) - 6
  const w = (width * PX) / 2
  const h = height * PX
  const shape = new Path2D()
  if (options.round) {
    shape.ellipse(cx, top + h / 2, w, h / 2, 0, 0, Math.PI * 2)
  } else {
    shape.moveTo(cx - w, top)
    shape.quadraticCurveTo(cx, top + h * 0.2, cx + w, top)
    shape.bezierCurveTo(cx + w * 0.92, top + h * 1.05, cx - w * 0.92, top + h * 1.05, cx - w, top)
    shape.closePath()
  }
  ctx.fillStyle = '#6e1626'
  ctx.fill(shape)
  ctx.save()
  ctx.clip(shape)
  ctx.fillStyle = '#ff6f86'
  ctx.fill(ellipse(cx, top + h * 0.95, w * 0.62, h * 0.42))
  if (options.teeth) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - w, top - 4, w * 2, h * 0.28 + 4)
  }
  ctx.restore()
  ctx.strokeStyle = look.ink
  ctx.lineJoin = 'round'
  ctx.lineWidth = 6
  ctx.stroke(shape)
}

function wavyMouth({ ctx, look }: Face): void {
  const cx = px(0)
  const cy = py(MOUTH_Y) + 2
  ctx.strokeStyle = look.ink
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = LINE - 1
  ctx.beginPath()
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const x = cx - 28 + t * 56
    const y = cy + Math.sin(t * Math.PI * 3) * 6
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

const DRAW: Record<Expression, (face: Face) => void> = {
  neutral: (face) => {
    cheeks(face)
    for (const side of SIDES) openEye(face, side)
    nose(face)
    smile(face)
  },
  blink: (face) => {
    cheeks(face)
    for (const side of SIDES) closedEye(face, side, 'rest')
    nose(face)
    smile(face)
  },
  happy: (face) => {
    cheeks(face, 1.35)
    for (const side of SIDES) closedEye(face, side, 'smile')
    nose(face)
    openMouth(face, 0.1, 0.07)
  },
  jump: (face) => {
    cheeks(face)
    for (const side of SIDES) openEye(face, side, { scale: 1.06 })
    nose(face)
    openMouth(face, 0.05, 0.06, { round: true })
  },
  hurt: (face) => {
    cheeks(face, 0.6)
    for (const side of SIDES) squintEye(face, side)
    nose(face)
    wavyMouth(face)
  },
  focus: (face) => {
    cheeks(face, 0.9)
    for (const side of SIDES) openEye(face, side, { lid: true })
    nose(face)
    openMouth(face, 0.1, 0.05, { teeth: true })
  },
  ko: (face) => {
    cheeks(face, 0.5)
    for (const side of SIDES) crossEye(face, side)
    nose(face)
    openMouth(face, 0.045, 0.045, { round: true })
  },
  wink: (face) => {
    cheeks(face, 1.3)
    openEye(face, -1)
    closedEye(face, 1, 'smile')
    nose(face)
    openMouth(face, 0.09, 0.065)
  },
}

function bleed(image: ImageData, background: string): Uint8Array {
  const { width, height, data } = image
  const [r, g, b] = channels(background)
  const out = new Uint8Array(data.length)
  for (let row = 0; row < height; row++) {
    const from = row * width * 4
    const to = (height - 1 - row) * width * 4
    for (let i = 0; i < width * 4; i += 4) {
      const alpha = data[from + i + 3]
      out[to + i] = alpha ? data[from + i] : r
      out[to + i + 1] = alpha ? data[from + i + 1] : g
      out[to + i + 2] = alpha ? data[from + i + 2] : b
      out[to + i + 3] = alpha
    }
  }
  return out
}

function paintAtlas(id: CharacterId): DataTexture {
  const canvas = document.createElement('canvas')
  canvas.width = CELL.width * COLUMNS
  canvas.height = CELL.height * ROWS
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2D canvas is not available')
  const look = HERO_LOOKS[id]
  EXPRESSIONS.forEach((expression, index) => {
    ctx.save()
    ctx.translate((index % COLUMNS) * CELL.width, Math.floor(index / COLUMNS) * CELL.height)
    ctx.beginPath()
    ctx.rect(0, 0, CELL.width, CELL.height)
    ctx.clip()
    DRAW[expression]({ ctx, look, id })
    ctx.restore()
  })
  const pixels = bleed(ctx.getImageData(0, 0, canvas.width, canvas.height), look.body)
  const texture = new DataTexture(pixels, canvas.width, canvas.height)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 4
  texture.repeat.set(1 / COLUMNS, 1 / ROWS)
  texture.needsUpdate = true
  return texture
}

export function getFaceAtlas(id: CharacterId): FaceAtlas {
  const cached = atlases.get(id)
  if (cached) return cached
  const texture = paintAtlas(id)
  const atlas: FaceAtlas = {
    texture,
    show: (expression) => {
      const index = EXPRESSIONS.indexOf(expression)
      texture.offset.set((index % COLUMNS) / COLUMNS, 1 - (Math.floor(index / COLUMNS) + 1) / ROWS)
    },
  }
  atlas.show('neutral')
  atlases.set(id, atlas)
  return atlas
}

import {
  CanvasTexture,
  LinearFilter,
  NearestFilter,
  NearestMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'

const SIZE = 32

type Draw = (ctx: CanvasRenderingContext2D, random: () => number) => void

export interface TilePalette {
  grass: string
  grassSpeckles: string[]
  grassEdge: string
  grassHighlight: string
  dirt: string
  dirtSpeckles: string[]
  pebble: string
  pebbleShade: string
  stone: string
  stoneSpeckles: string[]
  stoneLight: string
  stoneDark: string
  stoneSeam: string
  stoneSeamLight: string
}

export function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pixelTexture(seed: number, draw: Draw): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  draw(ctx, createRandom(seed))
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.minFilter = NearestMipmapLinearFilter
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = 8
  return texture
}

function fill(ctx: CanvasRenderingContext2D, color: string, x = 0, y = 0, w = SIZE, h = SIZE): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function speckle(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  colors: string[],
  count: number,
  area = { x: 0, y: 0, w: SIZE, h: SIZE },
): void {
  for (let i = 0; i < count; i++) {
    const x = area.x + Math.floor(random() * area.w)
    const y = area.y + Math.floor(random() * area.h)
    const size = random() > 0.7 ? 2 : 1
    fill(ctx, colors[Math.floor(random() * colors.length)], x, y, size, size)
  }
}

function bevel(ctx: CanvasRenderingContext2D, light: string, dark: string, width = 2): void {
  fill(ctx, light, 0, 0, SIZE, width)
  fill(ctx, light, 0, 0, width, SIZE)
  fill(ctx, dark, 0, SIZE - width, SIZE, width)
  fill(ctx, dark, SIZE - width, 0, width, SIZE)
}

function drawDirt(ctx: CanvasRenderingContext2D, random: () => number, palette: TilePalette): void {
  fill(ctx, palette.dirt)
  speckle(ctx, random, palette.dirtSpeckles, 110)
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(random() * (SIZE - 3))
    const y = Math.floor(random() * (SIZE - 2))
    fill(ctx, palette.pebble, x, y, 3, 2)
    fill(ctx, palette.pebbleShade, x, y + 2, 3, 1)
  }
}

function drawGrassTop(ctx: CanvasRenderingContext2D, random: () => number, palette: TilePalette): void {
  fill(ctx, palette.grass)
  speckle(ctx, random, palette.grassSpeckles, 160)
}

function drawGrassSide(ctx: CanvasRenderingContext2D, random: () => number, palette: TilePalette): void {
  drawDirt(ctx, random, palette)
  for (let x = 0; x < SIZE; x++) {
    const depth = 7 + Math.floor(random() * 4) + (x % 5 === 0 ? 2 : 0)
    fill(ctx, palette.grass, x, 0, 1, depth)
    fill(ctx, palette.grassEdge, x, depth, 1, 1)
  }
  fill(ctx, palette.grassHighlight, 0, 0, SIZE, 1)
  speckle(ctx, random, palette.grassSpeckles.slice(0, 2), 40, { x: 0, y: 1, w: SIZE, h: 6 })
}

function drawStone(ctx: CanvasRenderingContext2D, random: () => number, palette: TilePalette): void {
  fill(ctx, palette.stone)
  speckle(ctx, random, palette.stoneSpeckles, 90)
  bevel(ctx, palette.stoneLight, palette.stoneDark)
  fill(ctx, palette.stoneSeam, 6, 15, 20, 1)
  fill(ctx, palette.stoneSeamLight, 6, 16, 20, 1)
}

function drawBrick(ctx: CanvasRenderingContext2D, random: () => number): void {
  fill(ctx, '#6b3a26')
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 0 : 8
    for (let col = -1; col < 2; col++) {
      const x = col * 16 + offset + 1
      const y = row * 8 + 1
      fill(ctx, '#c96a3e', x, y, 14, 6)
      fill(ctx, '#e38c5c', x, y, 14, 1)
      fill(ctx, '#a3532f', x, y + 5, 14, 1)
      speckle(ctx, random, ['#b85d34', '#d77a4b'], 6, { x: Math.max(0, x), y, w: 12, h: 5 })
    }
  }
}

function drawEmblemCrate(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  colors: { base: string; light: string; dark: string; rivet: string },
  emblem: (ctx: CanvasRenderingContext2D) => void,
): void {
  fill(ctx, colors.base)
  speckle(ctx, random, [colors.light, colors.dark], 30, { x: 4, y: 4, w: 24, h: 24 })
  fill(ctx, colors.dark, 0, 0, SIZE, 3)
  fill(ctx, colors.dark, 0, SIZE - 3, SIZE, 3)
  fill(ctx, colors.dark, 0, 0, 3, SIZE)
  fill(ctx, colors.dark, SIZE - 3, 0, 3, SIZE)
  fill(ctx, colors.light, 3, 3, SIZE - 6, 1)
  fill(ctx, colors.light, 3, 3, 1, SIZE - 6)
  for (const [x, y] of [
    [5, 5],
    [25, 5],
    [5, 25],
    [25, 25],
  ]) {
    fill(ctx, colors.rivet, x, y, 2, 2)
  }
  emblem(ctx)
}

function drawCrate(ctx: CanvasRenderingContext2D, random: () => number): void {
  drawEmblemCrate(
    ctx,
    random,
    { base: '#f2b431', light: '#ffd66b', dark: '#b97a17', rivet: '#8a5a12' },
    (c) => {
      const rows = [1, 3, 5, 7, 9, 11, 9, 7, 5, 3, 1]
      rows.forEach((width, i) => {
        const x = 16 - Math.ceil(width / 2)
        fill(c, '#8a5a12', x - 1, 10 + i, width + 2, 1)
      })
      rows.forEach((width, i) => {
        const x = 16 - Math.ceil(width / 2)
        if (width > 1) fill(c, '#fff4cf', x, 10 + i, width, 1)
      })
      fill(c, '#ffffff', 14, 13, 2, 2)
    },
  )
}

function drawLifeCrate(ctx: CanvasRenderingContext2D, random: () => number): void {
  drawEmblemCrate(
    ctx,
    random,
    { base: '#3cb4e6', light: '#8fdcff', dark: '#1f78a8', rivet: '#145a80' },
    (c) => {
      const heart = [
        '.XX...XX.',
        'XXXX.XXXX',
        'XXXXXXXXX',
        'XXXXXXXXX',
        '.XXXXXXX.',
        '..XXXXX..',
        '...XXX...',
        '....X....',
      ]
      heart.forEach((line, row) => {
        for (let col = 0; col < line.length; col++) {
          if (line[col] === 'X') fill(c, '#ff5d73', 11 + col, 11 + row, 1, 1)
        }
      })
      fill(c, '#ffd1d8', 12, 12, 2, 1)
    },
  )
}

function drawUsed(ctx: CanvasRenderingContext2D, random: () => number): void {
  fill(ctx, '#a07a58')
  speckle(ctx, random, ['#8f6b4b', '#b08b68'], 70)
  bevel(ctx, '#bf9a76', '#6e4f36', 3)
  for (const [x, y] of [
    [5, 5],
    [25, 5],
    [5, 25],
    [25, 25],
  ]) {
    fill(ctx, '#5a3f2a', x, y, 2, 2)
  }
}

function drawPlank(ctx: CanvasRenderingContext2D, random: () => number): void {
  fill(ctx, '#c08a52')
  for (let y = 2; y < SIZE; y += 5) {
    let x = 0
    while (x < SIZE) {
      const length = 4 + Math.floor(random() * 10)
      fill(ctx, '#a2703f', x, y, length, 1)
      x += length + 2 + Math.floor(random() * 4)
    }
  }
  fill(ctx, '#e0ac72', 0, 0, SIZE, 1)
  fill(ctx, '#7f5530', 0, SIZE - 1, SIZE, 1)
}

export function createBannerTexture(): CanvasTexture {
  return pixelTexture(21, (ctx) => {
    fill(ctx, '#2f6fde')
    fill(ctx, '#245bc0', 0, 0, SIZE, 3)
    fill(ctx, '#245bc0', 0, SIZE - 3, SIZE, 3)
    const rows = [1, 3, 5, 7, 9, 11, 13, 11, 9, 7, 5, 3, 1]
    rows.forEach((width, i) => {
      fill(ctx, '#ffffff', 16 - Math.ceil(width / 2), 9 + i, width, 1)
    })
    fill(ctx, '#ffc531', 15, 14, 2, 3)
  })
}

export function createSkyTexture([top, middle, horizon]: [string, string, string]): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, top)
  gradient.addColorStop(0.55, middle)
  gradient.addColorStop(1, horizon)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 4, 256)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  return texture
}

export interface TileTextures {
  dirt: CanvasTexture
  grassTop: CanvasTexture
  grassSide: CanvasTexture
  stone: CanvasTexture
  brick: CanvasTexture
  crate: CanvasTexture
  lifeCrate: CanvasTexture
  used: CanvasTexture
  plank: CanvasTexture
}

interface SharedTextures {
  brick: CanvasTexture
  crate: CanvasTexture
  lifeCrate: CanvasTexture
  used: CanvasTexture
  plank: CanvasTexture
}

let sharedTextures: SharedTextures | null = null
const themedTextures = new Map<TilePalette, TileTextures>()

function getSharedTextures(): SharedTextures {
  sharedTextures ??= {
    brick: pixelTexture(15, drawBrick),
    crate: pixelTexture(16, drawCrate),
    lifeCrate: pixelTexture(17, drawLifeCrate),
    used: pixelTexture(18, drawUsed),
    plank: pixelTexture(19, drawPlank),
  }
  return sharedTextures
}

export function getBrickTexture(): CanvasTexture {
  return getSharedTextures().brick
}

export function getTileTextures(palette: TilePalette): TileTextures {
  let textures = themedTextures.get(palette)
  if (!textures) {
    textures = {
      ...getSharedTextures(),
      dirt: pixelTexture(11, (ctx, random) => drawDirt(ctx, random, palette)),
      grassTop: pixelTexture(12, (ctx, random) => drawGrassTop(ctx, random, palette)),
      grassSide: pixelTexture(13, (ctx, random) => drawGrassSide(ctx, random, palette)),
      stone: pixelTexture(14, (ctx, random) => drawStone(ctx, random, palette)),
    }
    themedTextures.set(palette, textures)
  }
  return textures
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  draw(ctx)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

export function createWaterfallTexture(seed: number): CanvasTexture {
  const random = createRandom(seed)
  const width = 64
  const height = 256
  return canvasTexture(width, height, (ctx) => {
    for (let x = 0; x < width; x++) {
      const edge = Math.min(1, x / 10, (width - 1 - x) / 10)
      ctx.fillStyle = `rgba(178, 225, 242, ${0.62 * edge})`
      ctx.fillRect(x, 0, 1, height)
    }
    for (let i = 0; i < 160; i++) {
      const x = Math.floor(random() * width)
      const edge = Math.min(1, x / 10, (width - 1 - x) / 10)
      const length = 24 + random() * 90
      const y = random() * height
      const light = random() > 0.3
      ctx.fillStyle = light ? `rgba(255, 255, 255, ${(0.45 + random() * 0.5) * edge})` : `rgba(96, 168, 204, ${0.5 * edge})`
      ctx.fillRect(x, y, random() > 0.6 ? 2 : 1, length)
      ctx.fillRect(x, y - height, random() > 0.6 ? 2 : 1, length)
    }
  })
}

export function createRippleTexture(): CanvasTexture {
  const random = createRandom(31)
  const size = 128
  return canvasTexture(size, size, (ctx) => {
    ctx.fillStyle = '#3d8fb9'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 90; i++) {
      const x = random() * size
      const y = random() * size
      const length = 8 + random() * 26
      ctx.fillStyle = random() > 0.4 ? 'rgba(160, 220, 240, 0.55)' : 'rgba(40, 110, 150, 0.6)'
      ctx.fillRect(x, y, length, 1.5)
      ctx.fillRect(x - size, y, length, 1.5)
    }
  })
}

export function createSoftDotTexture(): CanvasTexture {
  const size = 64
  return canvasTexture(size, size, (ctx) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.35)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  })
}

const LAVA = {
  crust: [30, 7, 4],
  molten: [150, 38, 9],
  hot: [236, 118, 32],
}

function blend(a: number[], b: number[], t: number): number[] {
  return a.map((value, i) => Math.round(value + (b[i] - value) * t))
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

function noiseLayer(width: number, height: number, cellsX: number, cellsY: number, random: () => number): Float32Array {
  const grid = Array.from({ length: cellsX * cellsY }, () => random())
  const layer = new Float32Array(width * height)
  const at = (x: number, y: number) => grid[(((y % cellsY) + cellsY) % cellsY) * cellsX + (((x % cellsX) + cellsX) % cellsX)]
  for (let y = 0; y < height; y++) {
    const fy = (y / height) * cellsY
    const y0 = Math.floor(fy)
    const ty = smooth(fy - y0)
    for (let x = 0; x < width; x++) {
      const fx = (x / width) * cellsX
      const x0 = Math.floor(fx)
      const tx = smooth(fx - x0)
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx
      layer[y * width + x] = top + (bottom - top) * ty
    }
  }
  return layer
}

function fractal(width: number, height: number, cells: [number, number][], random: () => number): Float32Array {
  const octaves = cells.map(([x, y], i) => ({ layer: noiseLayer(width, height, x, y, random), weight: 0.5 ** i }))
  const total = octaves.reduce((sum, octave) => sum + octave.weight, 0)
  const result = new Float32Array(width * height)
  for (let i = 0; i < result.length; i++) result[i] = octaves.reduce((sum, octave) => sum + octave.layer[i] * octave.weight, 0) / total
  return result
}

export function createLavaTexture(): CanvasTexture {
  const size = 256
  const random = createRandom(77)
  const noise = fractal(size, size, [[4, 4], [8, 8], [16, 16], [32, 32]], random)
  return canvasTexture(size, size, (ctx) => {
    const image = ctx.createImageData(size, size)
    for (let i = 0; i < size * size; i++) {
      const value = noise[i]
      const heat = Math.min(1, Math.max(0, (value - 0.38) / 0.45))
      const color = heat < 0.7 ? blend(LAVA.crust, LAVA.molten, smooth(heat / 0.7)) : blend(LAVA.molten, LAVA.hot, smooth((heat - 0.7) / 0.3))
      image.data.set([color[0], color[1], color[2], 255], i * 4)
    }
    ctx.putImageData(image, 0, 0)
  })
}

const LAVAFALL = {
  crust: [120, 24, 8],
  molten: [236, 84, 12],
  hot: [255, 176, 48],
}

export function createLavafallTexture(seed: number): CanvasTexture {
  const width = 128
  const height = 512
  const noise = fractal(width, height, [[4, 3], [8, 6], [16, 12], [32, 6]], createRandom(seed))
  return canvasTexture(width, height, (ctx) => {
    const image = ctx.createImageData(width, height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x
        const across = Math.abs(x / (width - 1) - 0.5) * 2
        const edge = Math.min(1, (1 - across) / 0.14)
        const heat = Math.min(1, Math.max(0, 0.28 + (1 - across * across) * 0.46 + (noise[i] - 0.5) * 1.2))
        const color =
          heat < 0.42
            ? blend(LAVAFALL.crust, LAVAFALL.molten, smooth(Math.max(0, heat - 0.28) / 0.14))
            : blend(LAVAFALL.molten, LAVAFALL.hot, smooth((heat - 0.42) / 0.58))
        image.data.set([color[0], color[1], color[2], Math.round(255 * edge)], i * 4)
      }
    }
    ctx.putImageData(image, 0, 0)
  })
}

export function createSmokeTexture(): CanvasTexture {
  const size = 128
  const random = createRandom(53)
  return canvasTexture(size, size, (ctx) => {
    for (let i = 0; i < 9; i++) {
      const angle = random() * Math.PI * 2
      const distance = random() * size * 0.18
      const x = size / 2 + Math.cos(angle) * distance
      const y = size / 2 + Math.sin(angle) * distance * 0.7
      const radius = size * (0.18 + random() * 0.14)
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    }
  })
}

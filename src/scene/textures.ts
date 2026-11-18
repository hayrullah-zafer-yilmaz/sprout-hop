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

function drawDirt(ctx: CanvasRenderingContext2D, random: () => number): void {
  fill(ctx, '#8b5a3c')
  speckle(ctx, random, ['#74482d', '#9d6a46', '#7d5034'], 110)
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(random() * (SIZE - 3))
    const y = Math.floor(random() * (SIZE - 2))
    fill(ctx, '#b98a64', x, y, 3, 2)
    fill(ctx, '#6b4229', x, y + 2, 3, 1)
  }
}

function drawGrassTop(ctx: CanvasRenderingContext2D, random: () => number): void {
  fill(ctx, '#5bbf4f')
  speckle(ctx, random, ['#4caa42', '#74d265', '#66c95a', '#8ee07f'], 160)
}

function drawGrassSide(ctx: CanvasRenderingContext2D, random: () => number): void {
  drawDirt(ctx, random)
  for (let x = 0; x < SIZE; x++) {
    const depth = 7 + Math.floor(random() * 4) + (x % 5 === 0 ? 2 : 0)
    fill(ctx, '#5bbf4f', x, 0, 1, depth)
    fill(ctx, '#3f9a38', x, depth, 1, 1)
  }
  fill(ctx, '#8ee07f', 0, 0, SIZE, 1)
  speckle(ctx, random, ['#4caa42', '#74d265'], 40, { x: 0, y: 1, w: SIZE, h: 6 })
}

function drawStone(ctx: CanvasRenderingContext2D, random: () => number): void {
  fill(ctx, '#a3acb6')
  speckle(ctx, random, ['#949ea9', '#b3bbc4', '#8b95a0'], 90)
  bevel(ctx, '#cbd2d9', '#6f7882')
  fill(ctx, '#8f99a4', 6, 15, 20, 1)
  fill(ctx, '#bcc4cc', 6, 16, 20, 1)
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

export function createSkyTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#3f8fe0')
  gradient.addColorStop(0.55, '#8cc8ff')
  gradient.addColorStop(1, '#dff1ff')
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

let tileTextures: TileTextures | null = null

export function getTileTextures(): TileTextures {
  tileTextures ??= createTileTextures()
  return tileTextures
}

function createTileTextures(): TileTextures {
  return {
    dirt: pixelTexture(11, drawDirt),
    grassTop: pixelTexture(12, drawGrassTop),
    grassSide: pixelTexture(13, drawGrassSide),
    stone: pixelTexture(14, drawStone),
    brick: pixelTexture(15, drawBrick),
    crate: pixelTexture(16, drawCrate),
    lifeCrate: pixelTexture(17, drawLifeCrate),
    used: pixelTexture(18, drawUsed),
    plank: pixelTexture(19, drawPlank),
  }
}

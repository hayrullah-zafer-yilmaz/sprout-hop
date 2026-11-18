import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three'
import { EFFECTS } from '../game/config'
import { Tile, type TileId } from '../game/level'
import type { World } from '../game/world'
import { getTileTextures, type TilePalette } from './textures'

type Kind = 'grass' | 'dirt' | 'stone' | 'brick' | 'crate' | 'life' | 'used' | 'plank'

interface Placement {
  kind: Kind
  x: number
  y: number
}

interface Entry {
  kind: Kind
  index: number
  x: number
  y: number
}

interface TileAssets {
  geometry: Record<Kind, BufferGeometry>
  material: Record<Kind, Material | Material[]>
}

const KINDS: Kind[] = ['grass', 'dirt', 'stone', 'brick', 'crate', 'life', 'used', 'plank']

const KIND_OF_TILE: Partial<Record<TileId, Kind>> = {
  [Tile.Stone]: 'stone',
  [Tile.Brick]: 'brick',
  [Tile.Crate]: 'crate',
  [Tile.LifeCrate]: 'life',
  [Tile.Used]: 'used',
  [Tile.Plank]: 'plank',
}

const GROUND_DEPTH = 3
const STONE_DEPTH = 2
const EDGE_PADDING = 14
const CLIFF_DEPTH = 7
const BUMP_HEIGHT = 0.28
const SHADOWLESS: Kind[] = ['grass', 'dirt']
const HIDDEN = new Matrix4().makeScale(0, 0, 0)

function boxWithDepth(width: number, height: number, depth: number): BoxGeometry {
  const geometry = new BoxGeometry(width, height, depth)
  const uv = geometry.attributes.uv
  for (let i = 0; i < 8; i++) uv.setX(i, uv.getX(i) * depth)
  for (let i = 8; i < 16; i++) uv.setY(i, uv.getY(i) * depth)
  uv.needsUpdate = true
  return geometry
}

const sharedAssets = new Map<TilePalette, TileAssets>()

function getTileAssets(palette: TilePalette): TileAssets {
  const cached = sharedAssets.get(palette)
  if (cached) return cached
  const textures = getTileTextures(palette)
  const paint = (map: Texture, emissive = '#000000') => new MeshStandardMaterial({ map, roughness: 0.92, emissive })
  const ground = boxWithDepth(1, 1, GROUND_DEPTH)
  const block = new BoxGeometry(1, 1, 1)
  const dirt = paint(textures.dirt)
  const grassSide = paint(textures.grassSide)
  const assets: TileAssets = {
    geometry: {
      grass: ground,
      dirt: ground,
      stone: boxWithDepth(1, 1, STONE_DEPTH),
      brick: block,
      crate: block,
      life: block,
      used: block,
      plank: boxWithDepth(1, 0.3, 1.4),
    },
    material: {
      grass: [grassSide, grassSide, paint(textures.grassTop), dirt, grassSide, grassSide],
      dirt,
      stone: paint(textures.stone),
      brick: paint(textures.brick),
      crate: paint(textures.crate, '#3a2400'),
      life: paint(textures.lifeCrate, '#06263a'),
      used: paint(textures.used),
      plank: paint(textures.plank),
    },
  }
  sharedAssets.set(palette, assets)
  return assets
}

export class TileMap {
  readonly group = new Group()
  private readonly world: World
  private readonly palette: TilePalette
  private readonly meshes = {} as Record<Kind, InstancedMesh>
  private readonly entries = new Map<number, Entry>()
  private readonly matrix = new Matrix4()
  private lifted = new Set<number>()
  private lifting = new Set<number>()

  constructor(world: World, palette: TilePalette) {
    this.world = world
    this.palette = palette
    this.group.name = 'tiles'
    const tiles = this.tilePlacements()
    const scenery = [...this.edgePlacements(), ...this.cliffPlacements()]
    const capacity = this.countKinds([...tiles, ...scenery])
    capacity.used += capacity.crate + capacity.life
    this.createMeshes(capacity)
    for (const placement of tiles) this.place(placement, true)
    for (const placement of scenery) this.place(placement, false)
  }

  update(): void {
    this.applyTileChanges()
    this.animateBumps()
  }

  dispose(): void {
    for (const mesh of Object.values(this.meshes)) mesh.dispose()
  }

  private kindAt(x: number, y: number): Kind | null {
    const tile = this.world.tileAt(x, y)
    if (tile === Tile.Ground) return this.world.tileAt(x, y + 1) === Tile.Ground ? 'dirt' : 'grass'
    return KIND_OF_TILE[tile] ?? null
  }

  private tilePlacements(): Placement[] {
    const placements: Placement[] = []
    for (let y = 0; y < this.world.height; y++) {
      for (let x = 0; x < this.world.width; x++) {
        const kind = this.kindAt(x, y)
        if (kind) placements.push({ kind, x, y })
      }
    }
    return placements
  }

  private edgePlacements(): Placement[] {
    const placements: Placement[] = []
    const edges = [
      { column: 0, direction: -1 },
      { column: this.world.width - 1, direction: 1 },
    ]
    for (const { column, direction } of edges) {
      for (let y = 0; y < this.world.height; y++) {
        const kind = this.kindAt(column, y)
        if (kind !== 'grass' && kind !== 'dirt') continue
        for (let i = 1; i <= EDGE_PADDING; i++) placements.push({ kind, x: column + direction * i, y })
      }
    }
    return placements
  }

  private cliffPlacements(): Placement[] {
    const placements: Placement[] = []
    for (let x = -EDGE_PADDING; x < this.world.width + EDGE_PADDING; x++) {
      const column = Math.min(Math.max(x, 0), this.world.width - 1)
      if (this.world.tileAt(column, 0) !== Tile.Ground) continue
      for (let y = -1; y >= -CLIFF_DEPTH; y--) placements.push({ kind: 'dirt', x, y })
    }
    return placements
  }

  private countKinds(placements: Placement[]): Record<Kind, number> {
    const counts = Object.fromEntries(KINDS.map((kind) => [kind, 0])) as Record<Kind, number>
    for (const { kind } of placements) counts[kind]++
    return counts
  }

  private createMeshes(capacity: Record<Kind, number>): void {
    const assets = getTileAssets(this.palette)
    for (const kind of KINDS) {
      const mesh = new InstancedMesh(assets.geometry[kind], assets.material[kind], Math.max(1, capacity[kind]))
      mesh.name = kind
      mesh.count = 0
      mesh.visible = false
      mesh.castShadow = !SHADOWLESS.includes(kind)
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      this.meshes[kind] = mesh
      this.group.add(mesh)
    }
  }

  private key(x: number, y: number): number {
    return y * this.world.width + x
  }

  private place({ kind, x, y }: Placement, tracked: boolean): void {
    const mesh = this.meshes[kind]
    mesh.visible = true
    const entry = { kind, index: mesh.count++, x: x + 0.5, y: y + (kind === 'plank' ? 0.85 : 0.5) }
    this.write(entry, 0)
    if (tracked) this.entries.set(this.key(x, y), entry)
  }

  private write(entry: Entry, lift: number): void {
    const mesh = this.meshes[entry.kind]
    mesh.setMatrixAt(entry.index, this.matrix.makeTranslation(entry.x, entry.y + lift, 0))
    mesh.instanceMatrix.needsUpdate = true
  }

  private applyTileChanges(): void {
    const changes = this.world.changedTiles
    for (const { x, y } of changes) {
      const key = this.key(x, y)
      const entry = this.entries.get(key)
      if (entry) {
        this.meshes[entry.kind].setMatrixAt(entry.index, HIDDEN)
        this.meshes[entry.kind].instanceMatrix.needsUpdate = true
        this.entries.delete(key)
      }
      if (this.world.tileAt(x, y) === Tile.Used) this.place({ kind: 'used', x, y }, true)
    }
    changes.length = 0
  }

  private animateBumps(): void {
    const lifting = this.lifting
    lifting.clear()
    for (const bump of this.world.bumps) {
      const key = this.key(bump.x, bump.y)
      const entry = this.entries.get(key)
      if (!entry) continue
      lifting.add(key)
      this.write(entry, Math.sin((1 - bump.t / EFFECTS.bumpTime) * Math.PI) * BUMP_HEIGHT)
    }
    for (const key of this.lifted) {
      const entry = this.entries.get(key)
      if (entry && !lifting.has(key)) this.write(entry, 0)
    }
    this.lifting = this.lifted
    this.lifted = lifting
  }
}

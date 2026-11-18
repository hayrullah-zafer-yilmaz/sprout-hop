import {
  Color,
  DoubleSide,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
} from 'three'
import { createBannerTexture } from './textures'

const BANNER_WIDTH = 1.5
const WAVE_AMPLITUDE = 0.13
const CONFETTI_COUNT = 70
const CONFETTI_LIFE = 4
const CONFETTI_GRAVITY = 9
const CONFETTI_DRAG = 0.8
const CONFETTI_COLORS = ['#2f6fde', '#ffd23f', '#ff6b8b', '#51cf66', '#ffffff', '#9b7bff']

export class FlagBanner {
  readonly mesh: Mesh<PlaneGeometry, MeshStandardMaterial>
  private readonly restX: number[]

  constructor() {
    const geometry = new PlaneGeometry(BANNER_WIDTH, 1, 10, 4).translate(BANNER_WIDTH / 2, 0, 0)
    const material = new MeshStandardMaterial({ map: createBannerTexture(), side: DoubleSide, roughness: 0.7 })
    this.mesh = new Mesh(geometry, material)
    this.mesh.castShadow = true
    const positions = geometry.attributes.position
    this.restX = Array.from({ length: positions.count }, (_, i) => positions.getX(i))
  }

  wave(elapsed: number): void {
    const positions = this.mesh.geometry.attributes.position
    this.restX.forEach((x, i) => {
      positions.setZ(i, Math.sin(x * 3.2 - elapsed * 6) * WAVE_AMPLITUDE * (x / BANNER_WIDTH))
    })
    positions.needsUpdate = true
    this.mesh.geometry.computeVertexNormals()
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.mesh.material.map?.dispose()
    this.mesh.material.dispose()
  }
}

interface Piece {
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  spin: number
  angle: number
}

export class ConfettiBurst {
  readonly mesh: InstancedMesh<PlaneGeometry, MeshStandardMaterial>
  private readonly pieces: Piece[]
  private readonly dummy = new Object3D()
  private age = Infinity

  constructor() {
    const material = new MeshStandardMaterial({ side: DoubleSide, roughness: 0.6 })
    this.mesh = new InstancedMesh(new PlaneGeometry(0.14, 0.22), material, CONFETTI_COUNT)
    this.mesh.frustumCulled = false
    this.mesh.visible = false
    const color = new Color()
    this.pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      this.mesh.setColorAt(i, color.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]))
      return { position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, spin: 0, angle: 0 }
    })
  }

  burst(x: number, y: number): void {
    this.age = 0
    this.mesh.visible = true
    for (const piece of this.pieces) {
      const direction = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 5
      piece.position = { x, y, z: 0 }
      piece.velocity = { x: Math.cos(direction) * speed, y: 4 + Math.random() * 7, z: Math.sin(direction) * speed * 0.6 }
      piece.spin = (Math.random() - 0.5) * 16
      piece.angle = Math.random() * Math.PI
    }
  }

  update(dt: number): void {
    if (!this.mesh.visible) return
    this.age += dt
    if (this.age > CONFETTI_LIFE) {
      this.mesh.visible = false
      return
    }
    const drag = 1 - dt * CONFETTI_DRAG
    this.pieces.forEach((piece, i) => {
      const { position, velocity } = piece
      velocity.y -= CONFETTI_GRAVITY * dt
      velocity.x *= drag
      velocity.z *= drag
      position.x += velocity.x * dt
      position.y += velocity.y * dt
      position.z += velocity.z * dt
      piece.angle += piece.spin * dt
      this.dummy.position.set(position.x, position.y, position.z)
      this.dummy.rotation.set(piece.angle, piece.angle * 0.7, 0)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this.dummy.matrix)
    })
    this.mesh.instanceMatrix.needsUpdate = true
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.mesh.dispose()
  }
}

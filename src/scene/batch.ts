import {
  Color,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  type BufferGeometry,
  type Material,
  type MeshStandardMaterialParameters,
} from 'three'

export interface Placement {
  x: number
  y: number
  z: number
  sx: number
  sy: number
  sz: number
  ry?: number
  color?: string
}

export class Batch {
  private readonly items: Placement[] = []
  private readonly geometry: BufferGeometry
  private readonly material: Material
  private readonly castShadow: boolean

  constructor(geometry: BufferGeometry, material: Material, castShadow = false) {
    this.geometry = geometry
    this.material = material
    this.castShadow = castShadow
  }

  add(item: Placement): void {
    this.items.push(item)
  }

  build(): InstancedMesh {
    const mesh = new InstancedMesh(this.geometry, this.material, Math.max(1, this.items.length))
    mesh.count = this.items.length
    const dummy = new Object3D()
    const color = new Color()
    this.items.forEach((item, i) => {
      dummy.position.set(item.x, item.y, item.z)
      dummy.rotation.set(0, item.ry ?? 0, 0)
      dummy.scale.set(item.sx, item.sy, item.sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      if (item.color) mesh.setColorAt(i, color.set(item.color))
    })
    mesh.castShadow = this.castShadow
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    return mesh
  }
}

export function lowPoly(color: string, options: MeshStandardMaterialParameters = {}): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, flatShading: true, roughness: 0.95, ...options })
}

export function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length)]
}

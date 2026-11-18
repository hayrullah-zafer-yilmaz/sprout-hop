import type { Object3D } from 'three'

export interface NodeList<T extends Object3D> {
  items: (T | undefined)[]
  refAt: (index: number) => (node: unknown) => void
}

export function nodeList<T extends Object3D>(): NodeList<T> {
  const items: (T | undefined)[] = []
  return {
    items,
    refAt: (index) => (node) => {
      items[index] = (node as T | null) ?? undefined
    },
  }
}

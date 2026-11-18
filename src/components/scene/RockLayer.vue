<script setup lang="ts">
import { InstancedMesh, Matrix4, Object3D, type BufferGeometry, type Material } from 'three'
import { markRaw, onBeforeUnmount } from 'vue'
import { useLoop } from '@tresjs/core'
import { ROCKS } from '../../game/config'
import type { Rock, RockState } from '../../game/entities'
import { rockParts } from '../../scene/assets'
import { PRIORITY, useTheme, useWorld } from '../../scene/context'

interface Puff {
  active: boolean
  x: number
  y: number
  z: number
  vx: number
  age: number
  size: number
}

const HIDDEN = new Matrix4().makeScale(0, 0, 0)
const SPIN = 4
const PEBBLES = 3
const PEBBLE_DROP = 7
const PUFFS = 30
const PUFFS_PER_CRASH = 6
const PUFF_LIFE = 0.6

const world = useWorld()
const theme = useTheme()
const dummy = new Object3D()
const count = Math.max(1, world.rocks.length)
const states: RockState[] = world.rocks.map((rock) => rock.state)
const puffs: Puff[] = Array.from({ length: PUFFS }, () => ({ active: false, x: 0, y: 0, z: 0, vx: 0, age: 0, size: 1 }))

function instanced(geometry: BufferGeometry, material: Material, size: number, shadow: boolean): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, size)
  mesh.frustumCulled = false
  mesh.castShadow = shadow
  for (let i = 0; i < size; i++) mesh.setMatrixAt(i, HIDDEN)
  return markRaw(mesh)
}

const shadows = instanced(rockParts.shadow, rockParts.shade, count, false)
const boulders = instanced(rockParts.body, rockParts.basalt, count, true)
const pebbles = instanced(rockParts.rubble, rockParts.basalt, count * PEBBLES, false)
const dust = instanced(rockParts.puff, rockParts.dust, PUFFS, false)
const meshes = [shadows, boulders, pebbles, dust]

function place(mesh: InstancedMesh, index: number): void {
  dummy.updateMatrix()
  mesh.setMatrixAt(index, dummy.matrix)
}

function kickDust(x: number, y: number): void {
  let spawned = 0
  for (const puff of puffs) {
    if (puff.active) continue
    const side = spawned % 2 === 0 ? -1 : 1
    Object.assign(puff, {
      active: true,
      x: x + side * (0.15 + Math.random() * 0.45),
      y: y + 0.12,
      z: (Math.random() - 0.5) * 0.9,
      vx: side * (0.8 + Math.random() * 1.2),
      age: 0,
      size: 0.7 + Math.random() * 0.6,
    })
    spawned++
    if (spawned === PUFFS_PER_CRASH) return
  }
}

function hideRock(index: number): void {
  shadows.setMatrixAt(index, HIDDEN)
  boulders.setMatrixAt(index, HIDDEN)
  for (let i = 0; i < PEBBLES; i++) pebbles.setMatrixAt(index * PEBBLES + i, HIDDEN)
}

function showRock(rock: Rock, index: number, elapsed: number): void {
  const center = rock.x + rock.w / 2
  const floor = rock.floor ?? theme.lava ?? 0
  const warming = rock.state === 'warning' ? 1 - Math.max(0, rock.timer) / ROCKS.warning : 1
  const closing = rock.state === 'falling' ? 1 - Math.min(1, Math.max(0, rock.y - floor) / (rock.top - floor)) : 0
  dummy.position.set(center, floor + 0.02, 0)
  dummy.rotation.set(0, 0, 0)
  dummy.scale.setScalar(0.5 + warming * 0.35 + closing * 0.35)
  place(shadows, index)
  for (let i = 0; i < PEBBLES; i++) {
    const slot = index * PEBBLES + i
    if (rock.state !== 'warning') {
      pebbles.setMatrixAt(slot, HIDDEN)
      continue
    }
    const phase = (elapsed * 1.4 + i / PEBBLES) % 1
    dummy.position.set(center + (i - 1) * 0.28, floor + PEBBLE_DROP * (1 - phase), (i - 1) * 0.2)
    dummy.rotation.set(phase * 6, phase * 4, 0)
    dummy.scale.setScalar(0.9 + i * 0.15)
    place(pebbles, slot)
  }
  if (rock.state !== 'falling') {
    boulders.setMatrixAt(index, HIDDEN)
    return
  }
  dummy.position.set(center, rock.y + rock.h / 2, 0)
  dummy.rotation.set(elapsed * SPIN, elapsed * SPIN * 0.7, 0)
  dummy.scale.setScalar(1)
  place(boulders, index)
}

function animateDust(dt: number): void {
  puffs.forEach((puff, index) => {
    if (!puff.active) {
      dust.setMatrixAt(index, HIDDEN)
      return
    }
    puff.age += dt
    puff.x += puff.vx * dt
    const t = puff.age / PUFF_LIFE
    if (t >= 1) {
      puff.active = false
      dust.setMatrixAt(index, HIDDEN)
      return
    }
    dummy.position.set(puff.x, puff.y + t * 0.5, puff.z)
    dummy.rotation.set(0, t * 2, 0)
    dummy.scale.setScalar(puff.size * Math.sin(Math.PI * Math.min(1, t * 1.15)))
    place(dust, index)
  })
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed, delta }) => {
  world.rocks.forEach((rock, index) => {
    if (states[index] === 'falling' && rock.state === 'resting' && rock.floor !== null) kickDust(rock.x + rock.w / 2, rock.floor)
    states[index] = rock.state
    if (rock.state === 'resting') hideRock(index)
    else showRock(rock, index, elapsed)
  })
  animateDust(Math.min(delta, 0.05))
  for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true
}, PRIORITY.models)

onBeforeUnmount(() => {
  for (const mesh of meshes) mesh.dispose()
})
</script>

<template>
  <primitive v-for="(mesh, index) in meshes" :key="index" :object="mesh" />
</template>

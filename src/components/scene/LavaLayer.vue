<script setup lang="ts">
import { InstancedMesh, Matrix4, Object3D } from 'three'
import { markRaw, onBeforeUnmount } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Box } from '../../game/collision'
import { lavaParts } from '../../scene/assets'
import { PRIORITY, useWorld } from '../../scene/context'

const props = defineProps<{ surface: number }>()

interface Drop {
  active: boolean
  x: number
  y: number
  z: number
  vx: number
  vy: number
  age: number
  size: number
}

const DROPS = 72
const PER_SPLASH = 12
const GRAVITY = 30
const LIFE = 0.9
const HIDDEN = new Matrix4().makeScale(0, 0, 0)

const world = useWorld()
const dummy = new Object3D()
const heights = new WeakMap<Box, number>()
const drops: Drop[] = Array.from({ length: DROPS }, () => ({ active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, age: 0, size: 1 }))
const mesh = markRaw(new InstancedMesh(lavaParts.drop, lavaParts.molten, DROPS))
mesh.frustumCulled = false
for (let i = 0; i < DROPS; i++) mesh.setMatrixAt(i, HIDDEN)

function splash(x: number): void {
  let spawned = 0
  for (const drop of drops) {
    if (drop.active) continue
    const angle = Math.random() * Math.PI
    Object.assign(drop, {
      active: true,
      x,
      y: props.surface,
      z: (Math.random() - 0.5) * 1.2,
      vx: Math.cos(angle) * (2 + Math.random() * 3),
      vy: 6 + Math.random() * 6,
      age: 0,
      size: 0.6 + Math.random() * 0.8,
    })
    spawned++
    if (spawned === PER_SPLASH) return
  }
}

function track(body: Box): void {
  const previous = heights.get(body)
  if (previous !== undefined && previous >= props.surface && body.y < props.surface) splash(body.x + body.w / 2)
  heights.set(body, body.y)
}

function move(drop: Drop, index: number, dt: number): void {
  if (!drop.active) {
    mesh.setMatrixAt(index, HIDDEN)
    return
  }
  drop.age += dt
  drop.vy -= GRAVITY * dt
  drop.x += drop.vx * dt
  drop.y += drop.vy * dt
  if (drop.age > LIFE || drop.y < props.surface - 0.2) {
    drop.active = false
    mesh.setMatrixAt(index, HIDDEN)
    return
  }
  dummy.position.set(drop.x, drop.y, drop.z)
  dummy.scale.setScalar(drop.size * (1 - (drop.age / LIFE) * 0.5))
  dummy.updateMatrix()
  mesh.setMatrixAt(index, dummy.matrix)
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const dt = Math.min(delta, 0.05)
  track(world.player)
  for (const enemy of world.enemies) if (!enemy.gone) track(enemy)
  for (const rock of world.rocks) track(rock)
  drops.forEach((drop, index) => move(drop, index, dt))
  mesh.instanceMatrix.needsUpdate = true
}, PRIORITY.models)

onBeforeUnmount(() => mesh.dispose())
</script>

<template>
  <primitive :object="mesh" />
</template>

<script setup lang="ts">
import { InstancedMesh, Matrix4, Object3D, type BufferGeometry, type Material } from 'three'
import { markRaw, onBeforeUnmount } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Debris, Pop } from '../../game/entities'
import { coinParts, debrisParts, heartParts, rockParts } from '../../scene/assets'
import { PRIORITY, useWorld } from '../../scene/context'

const HIDDEN = new Matrix4().makeScale(0, 0, 0)
const LIFE_FADE_START = 0.7
const LIFE_FADE_TIME = 0.4

const world = useWorld()
const dummy = new Object3D()

function instanced(geometry: BufferGeometry, material: Material, count: number): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, count)
  mesh.frustumCulled = false
  mesh.visible = false
  return markRaw(mesh)
}

const coinPops = instanced(coinParts.rim, coinParts.gold, world.pops.length)
const lifePops = instanced(heartParts.geometry, heartParts.material, world.pops.length)
const debris = instanced(debrisParts.geometry, debrisParts.material, world.debris.length)
const rubble = instanced(rockParts.rubble, rockParts.basalt, world.debris.length)
debris.castShadow = true
rubble.castShadow = true

function show<T>(mesh: InstancedMesh, items: T[], pose: (item: T, target: Object3D) => boolean): void {
  let anyShown = false
  items.forEach((item, index) => {
    if (pose(item, dummy)) {
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
      anyShown = true
    } else {
      mesh.setMatrixAt(index, HIDDEN)
    }
  })
  mesh.visible = anyShown
  mesh.instanceMatrix.needsUpdate = anyShown
}

function poseCoinPop(pop: Pop, target: Object3D): boolean {
  if (!pop.active || pop.kind !== 'coin') return false
  target.position.set(pop.x, pop.y + 0.5, 0.2)
  target.rotation.set(0, pop.age * 18, 0)
  target.scale.setScalar(1)
  return true
}

function poseLifePop(pop: Pop, target: Object3D): boolean {
  if (!pop.active || pop.kind !== 'life') return false
  target.position.set(pop.x, pop.y + 0.5, 0.2)
  target.rotation.set(0, Math.sin(pop.age * 6) * 0.4, 0)
  target.scale.setScalar(Math.max(0, 1 - Math.max(0, pop.age - LIFE_FADE_START) / LIFE_FADE_TIME))
  return true
}

function poseDebris(piece: Debris, target: Object3D): boolean {
  if (!piece.active) return false
  target.position.set(piece.x, piece.y, 0.3)
  target.rotation.set(piece.angle, 0, piece.angle * 1.3)
  target.scale.setScalar(1)
  return true
}

const { onBeforeRender } = useLoop()
onBeforeRender(() => {
  show(coinPops, world.pops, poseCoinPop)
  show(lifePops, world.pops, poseLifePop)
  show(debris, world.debris, (piece, target) => piece.kind === 'brick' && poseDebris(piece, target))
  show(rubble, world.debris, (piece, target) => piece.kind === 'rock' && poseDebris(piece, target))
}, PRIORITY.models)

onBeforeUnmount(() => {
  for (const mesh of [coinPops, lifePops, debris, rubble]) mesh.dispose()
})
</script>

<template>
  <primitive :object="coinPops" />
  <primitive :object="lifePops" />
  <primitive :object="debris" />
  <primitive :object="rubble" />
</template>

<script setup lang="ts">
import { MeshStandardMaterial, type Group } from 'three'
import { onBeforeUnmount } from 'vue'
import { useLoop } from '@tresjs/core'
import { PRIORITY, useWorld } from '../../scene/context'
import { nodeList } from '../../scene/nodes'

const RAISE_TIME = 0.5
const RAISE_HEIGHT = 0.9
const BANNER_Y = 1.2

const world = useWorld()
const banners = nodeList<Group>()
const paints = world.checkpoints.map(() => ({
  banner: new MeshStandardMaterial({ color: '#94a3b8', roughness: 0.6 }),
  orb: new MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.3 }),
  lit: false,
}))

function light(paint: (typeof paints)[number]): void {
  paint.lit = true
  paint.banner.color.set('#2f6fde')
  paint.orb.color.set('#ffe066')
  paint.orb.emissive.set('#ffb800')
  paint.orb.emissiveIntensity = 1.4
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  world.checkpoints.forEach((checkpoint, index) => {
    const banner = banners.items[index]
    if (!checkpoint.active || !banner) return
    if (!paints[index].lit) light(paints[index])
    const raised = Math.min(1, (world.clock - checkpoint.activatedAt) / RAISE_TIME)
    banner.position.y = BANNER_Y + raised * RAISE_HEIGHT
    banner.rotation.y = Math.sin(elapsed * 5) * 0.18
  })
}, PRIORITY.models)

onBeforeUnmount(() => {
  for (const paint of paints) {
    paint.banner.dispose()
    paint.orb.dispose()
  }
})
</script>

<template>
  <TresGroup v-for="(checkpoint, index) in world.checkpoints" :key="index" :position="[checkpoint.x + 0.5, checkpoint.y, -0.4]">
    <TresMesh cast-shadow :position="[0, 1.25, 0]">
      <TresCylinderGeometry :args="[0.05, 0.06, 2.5, 10]" />
      <TresMeshStandardMaterial color="#e2e8f0" :metalness="0.5" :roughness="0.35" />
    </TresMesh>
    <TresMesh :position="[0, 2.58, 0]" :material="paints[index].orb">
      <TresSphereGeometry :args="[0.13, 16, 12]" />
    </TresMesh>
    <TresMesh cast-shadow :position="[0, 0.1, 0]">
      <TresCylinderGeometry :args="[0.28, 0.34, 0.2, 12]" />
      <TresMeshStandardMaterial color="#64748b" :roughness="0.8" flat-shading />
    </TresMesh>
    <TresGroup :ref="banners.refAt(index)" :position="[0, BANNER_Y, 0]">
      <TresMesh cast-shadow :position="[0.36, 0, 0]" :material="paints[index].banner">
        <TresBoxGeometry :args="[0.66, 0.42, 0.04]" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>

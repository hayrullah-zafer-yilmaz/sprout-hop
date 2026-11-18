<script setup lang="ts">
import { markRaw, onBeforeUnmount } from 'vue'
import { useLoop } from '@tresjs/core'
import { ConfettiBurst, FlagBanner } from '../../scene/flag'
import { PRIORITY, useWorld } from '../../scene/context'

const WAVE_DISTANCE = 30
const BANNER_LOW = 1.1
const BANNER_TRAVEL = 1.7

const world = useWorld()
const goal = world.goal
const banner = markRaw(new FlagBanner())
const confetti = markRaw(new ConfettiBurst())
banner.mesh.position.set(goal.x + 0.58, goal.y + BANNER_LOW, 0)
let celebrated = false

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed, delta, camera }) => {
  banner.mesh.position.y = goal.y + BANNER_LOW + goal.flag * (goal.height - BANNER_TRAVEL)
  const cameraX = camera.value?.position.x ?? goal.x
  if (Math.abs(cameraX - goal.x) < WAVE_DISTANCE) banner.wave(elapsed)
  if (goal.reached && !celebrated) {
    celebrated = true
    confetti.burst(goal.x + 0.5, goal.y + goal.height + 0.4)
  }
  confetti.update(Math.min(delta, 0.1))
}, PRIORITY.models)

onBeforeUnmount(() => {
  banner.dispose()
  confetti.dispose()
})
</script>

<template>
  <TresGroup>
    <TresMesh cast-shadow receive-shadow :position="[goal.x + 0.5, goal.y + 0.06, 0]">
      <TresCylinderGeometry :args="[0.32, 0.4, 0.12, 12]" />
      <TresMeshStandardMaterial color="#64748b" :roughness="0.8" flat-shading />
    </TresMesh>
    <TresMesh cast-shadow :position="[goal.x + 0.5, goal.y + 0.1 + goal.height / 2, 0]">
      <TresCylinderGeometry :args="[0.07, 0.08, goal.height + 0.2, 12]" />
      <TresMeshStandardMaterial color="#e8edf3" :metalness="0.6" :roughness="0.3" />
    </TresMesh>
    <TresMesh cast-shadow :position="[goal.x + 0.5, goal.y + goal.height + 0.38, 0]">
      <TresSphereGeometry :args="[0.22, 20, 14]" />
      <TresMeshStandardMaterial color="#ffc531" :metalness="0.6" :roughness="0.25" emissive="#7a4a00" :emissive-intensity="0.5" />
    </TresMesh>
    <primitive :object="banner.mesh" />
    <primitive :object="confetti.mesh" />
  </TresGroup>
</template>

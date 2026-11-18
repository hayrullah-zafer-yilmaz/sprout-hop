<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { HERO, strideOf } from '../../../scene/hero'
import { PRIORITY, useWorld } from '../../../scene/context'

const { center: CENTER, radius: RADIUS } = HERO

const world = useWorld()
const sprout = shallowRef<Group>()
const scarfTail = shallowRef<Group>()

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  const p = world.player
  const stride = strideOf(p.vx)
  if (sprout.value) sprout.value.rotation.z = Math.sin(elapsed * 4) * 0.14 - p.vx * 0.03
  if (scarfTail.value) {
    const flutter = Math.sin(elapsed * 14) * 0.15 * (0.3 + stride)
    scarfTail.value.rotation.x = 0.5 + stride * 0.7 + (p.onGround ? 0 : 0.4) + flutter
  }
}, PRIORITY.models)
</script>

<template>
  <TresMesh :position="[0, CENTER - 0.25, 0]" :rotation="[Math.PI / 2, 0, 0]" cast-shadow>
    <TresTorusGeometry :args="[0.336, 0.036, 8, 36]" />
    <TresMeshStandardMaterial color="#2f6fde" :roughness="0.55" />
  </TresMesh>
  <TresGroup ref="scarfTail" :position="[0.1, CENTER - 0.25, -0.34]">
    <TresMesh :position="[0, -0.1, 0]" :rotation="[0, 0, -0.25]">
      <TresBoxGeometry :args="[0.09, 0.2, 0.04]" />
      <TresMeshStandardMaterial color="#2f6fde" :roughness="0.55" />
    </TresMesh>
    <TresMesh :position="[0.06, -0.08, 0.01]" :rotation="[0, 0, 0.3]">
      <TresBoxGeometry :args="[0.08, 0.16, 0.04]" />
      <TresMeshStandardMaterial color="#2a62c8" :roughness="0.55" />
    </TresMesh>
  </TresGroup>
  <TresGroup ref="sprout" :position="[0, CENTER + RADIUS - 0.03, 0]">
    <TresMesh :position="[0, 0.06, 0]">
      <TresCylinderGeometry :args="[0.018, 0.026, 0.13, 6]" />
      <TresMeshStandardMaterial color="#2f9e44" />
    </TresMesh>
    <TresMesh :position="[-0.1, 0.14, 0]" :rotation="[0, 0, 0.45]" :scale="[1.7, 0.5, 0.85]">
      <TresSphereGeometry :args="[0.085, 12, 8]" />
      <TresMeshStandardMaterial color="#51cf66" :roughness="0.5" />
    </TresMesh>
    <TresMesh :position="[0.1, 0.16, 0]" :rotation="[0, 0, -0.45]" :scale="[1.7, 0.5, 0.85]">
      <TresSphereGeometry :args="[0.085, 12, 8]" />
      <TresMeshStandardMaterial color="#51cf66" :roughness="0.5" />
    </TresMesh>
  </TresGroup>
</template>

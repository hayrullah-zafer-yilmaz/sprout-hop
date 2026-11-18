<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { HERO, strideOf } from '../../../scene/hero'
import { PRIORITY, useWorld } from '../../../scene/context'

const { center: CENTER, radius: RADIUS } = HERO
const LENSES = [-0.13, 0.13]
const SPIKES = [
  { x: -0.07, tilt: 0.45, height: 0.2 },
  { x: 0, tilt: 0, height: 0.26 },
  { x: 0.07, tilt: -0.45, height: 0.2 },
]

const world = useWorld()
const tuft = shallowRef<Group>()

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  if (!tuft.value) return
  const p = world.player
  tuft.value.rotation.x = -0.25 - strideOf(p.vx) * 0.55 + Math.sin(elapsed * 9) * 0.05
}, PRIORITY.models)
</script>

<template>
  <TresMesh :position="[0, CENTER + 0.24, 0]" :rotation="[Math.PI / 2 - 0.12, 0, 0]">
    <TresTorusGeometry :args="[0.355, 0.028, 8, 40]" />
    <TresMeshStandardMaterial color="#334155" :roughness="0.6" />
  </TresMesh>
  <TresGroup v-for="x in LENSES" :key="x" :position="[x, CENTER + 0.27, 0.3]" :rotation="[-0.5, x * 1.4, 0]">
    <TresMesh>
      <TresTorusGeometry :args="[0.084, 0.022, 8, 20]" />
      <TresMeshStandardMaterial color="#334155" :roughness="0.5" />
    </TresMesh>
    <TresMesh :rotation="[Math.PI / 2, 0, 0]">
      <TresCylinderGeometry :args="[0.078, 0.078, 0.02, 20]" />
      <TresMeshStandardMaterial color="#7af0dc" :metalness="0.2" :roughness="0.15" emissive="#2dd4bf" :emissive-intensity="0.55" />
    </TresMesh>
  </TresGroup>
  <TresGroup ref="tuft" :position="[0, CENTER + RADIUS - 0.04, -0.04]">
    <TresMesh v-for="spike in SPIKES" :key="spike.x" :position="[spike.x, spike.height / 2, 0]" :rotation="[0, 0, spike.tilt]" cast-shadow>
      <TresConeGeometry :args="[0.06, spike.height, 6]" />
      <TresMeshStandardMaterial color="#f4b400" :roughness="0.5" flat-shading />
    </TresMesh>
  </TresGroup>
</template>

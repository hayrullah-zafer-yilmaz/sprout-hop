<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { strideOf } from '../../../scene/hero'
import { getZipGear } from '../../../scene/heroGear'
import { PRIORITY, useWorld } from '../../../scene/context'

const gear = getZipGear()
const SPIKES = [
  { x: -0.075, tilt: 0.5, scale: 0.8 },
  { x: 0, tilt: 0, scale: 1.05 },
  { x: 0.075, tilt: -0.5, scale: 0.8 },
]

const world = useWorld()
const tuft = shallowRef<Group>()

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  if (!tuft.value) return
  tuft.value.rotation.x = -0.1 - strideOf(world.player.vx) * 0.45 + Math.sin(elapsed * 9) * 0.05
}, PRIORITY.models)
</script>

<template>
  <TresMesh :geometry="gear.band" :material="gear.strap" :position="[0, gear.bandY, 0]">
    <TresMesh :geometry="gear.band" :material="gear.strapOutline" />
  </TresMesh>
  <TresGroup v-for="(mount, index) in gear.goggles" :key="index" :position="mount.position" :rotation="mount.rotation">
    <TresMesh :geometry="gear.cup" :material="gear.metal" cast-shadow />
    <TresMesh :geometry="gear.rim" :material="gear.metal">
      <TresMesh :geometry="gear.rim" :material="gear.strapOutline" />
    </TresMesh>
    <TresMesh :geometry="gear.lens" :material="gear.glass" />
  </TresGroup>
  <TresGroup ref="tuft" :position="[0, gear.tuftY, -0.05]">
    <TresMesh
      v-for="spike in SPIKES"
      :key="spike.x"
      :geometry="gear.spike"
      :material="gear.spikeSkin"
      :position="[spike.x, 0, 0]"
      :rotation="[0, 0, spike.tilt]"
      :scale="spike.scale"
      cast-shadow
    >
      <TresMesh :geometry="gear.spike" :material="gear.spikeOutline" />
    </TresMesh>
  </TresGroup>
</template>

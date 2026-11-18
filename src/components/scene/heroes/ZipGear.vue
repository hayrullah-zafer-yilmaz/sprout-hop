<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { strideOf } from '../../../scene/hero'
import { getZipGear } from '../../../scene/heroGear'
import { PRIORITY, useWorld } from '../../../scene/context'

type Vec3 = [number, number, number]

const gear = getZipGear()
const BLADES: { x: number; rotation: Vec3; scale: number }[] = [
  { x: -0.07, rotation: [-0.5, 0, Math.PI / 2 + 0.38], scale: 0.82 },
  { x: 0, rotation: [-0.42, 0, Math.PI / 2], scale: 1.05 },
  { x: 0.07, rotation: [-0.5, 0, Math.PI / 2 - 0.38], scale: 0.82 },
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
  <TresGroup ref="tuft" :position="[0, gear.tuftY, -0.03]">
    <TresMesh
      v-for="blade in BLADES"
      :key="blade.x"
      :geometry="gear.blade"
      :material="gear.bladeSkin"
      :position="[blade.x, 0, 0]"
      :rotation="blade.rotation"
      :scale="blade.scale"
      cast-shadow
    >
      <TresMesh :geometry="gear.blade" :material="gear.bladeOutline" />
    </TresMesh>
  </TresGroup>
</template>

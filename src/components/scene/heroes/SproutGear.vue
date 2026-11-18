<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { strideOf } from '../../../scene/hero'
import { SCARF_Y, getSproutGear } from '../../../scene/heroGear'
import { PRIORITY, useWorld } from '../../../scene/context'
import { airborne } from './pose'

type Vec3 = [number, number, number]

const gear = getSproutGear()
const LEAVES: { rotation: Vec3; scale: number }[] = [
  { rotation: [0, Math.PI - 0.25, 0.42], scale: 0.92 },
  { rotation: [0, 0.3, 0.5], scale: 1.08 },
]
const TAILS: { rotation: Vec3; length: number }[] = [
  { rotation: [0, 0, -0.22], length: 1 },
  { rotation: [0, 0.2, 0.28], length: 0.82 },
]

const world = useWorld()
const sprout = shallowRef<Group>()
const tails = shallowRef<Group>()

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  const p = world.player
  const stride = strideOf(p.vx)
  if (sprout.value) sprout.value.rotation.z = Math.sin(elapsed * 4) * 0.14 - p.vx * 0.03
  if (tails.value) {
    const flutter = Math.sin(elapsed * 14) * 0.15 * (0.3 + stride)
    tails.value.rotation.x = 0.35 + stride * 0.75 + (airborne(p) ? 0.45 : 0) + flutter
  }
}, PRIORITY.models)
</script>

<template>
  <TresMesh
    :geometry="gear.scarf"
    :material="gear.scarfSkin"
    :position="[0, SCARF_Y, 0]"
    :rotation="[Math.PI / 2 + 0.06, 0, 0]"
    :scale="[1, 1, 1.7]"
    cast-shadow
  >
    <TresMesh :geometry="gear.scarf" :material="gear.scarfOutline" />
  </TresMesh>
  <TresMesh :geometry="gear.knot" :material="gear.knotSkin" :position="gear.knotPosition" cast-shadow>
    <TresMesh :geometry="gear.knot" :material="gear.scarfOutline" />
  </TresMesh>
  <TresGroup ref="tails" :position="gear.knotPosition">
    <TresMesh
      v-for="tail in TAILS"
      :key="tail.length"
      :geometry="gear.tail"
      :material="gear.tailSkin"
      :rotation="tail.rotation"
      :scale="[1, tail.length, 1]"
      cast-shadow
    >
      <TresMesh :geometry="gear.tail" :material="gear.scarfOutline" />
    </TresMesh>
  </TresGroup>
  <TresGroup ref="sprout" :position="[0, gear.sproutY, 0]">
    <TresMesh :geometry="gear.stem" :material="gear.stemSkin" />
    <TresMesh
      v-for="leaf in LEAVES"
      :key="leaf.scale"
      :geometry="gear.leaf"
      :material="gear.leafSkin"
      :position="[0, 0.11, 0]"
      :rotation="leaf.rotation"
      :scale="leaf.scale"
      cast-shadow
    >
      <TresMesh :geometry="gear.leaf" :material="gear.leafOutline" />
    </TresMesh>
  </TresGroup>
</template>

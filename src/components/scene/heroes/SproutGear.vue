<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { strideOf } from '../../../scene/hero'
import { getSproutGear } from '../../../scene/heroGear'
import { PRIORITY, useWorld } from '../../../scene/context'
import { nodeList } from '../../../scene/nodes'
import { airborne } from './pose'

type Vec3 = [number, number, number]

const gear = getSproutGear()
const LEAVES: { rotation: Vec3; scale: number }[] = [
  { rotation: [0, Math.PI - 0.22, 0.52], scale: 0.94 },
  { rotation: [0, 0.22, 0.58], scale: 1.04 },
]

const world = useWorld()
const sprout = shallowRef<Group>()
const leaves = nodeList<Group>()

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  const p = world.player
  const stride = strideOf(p.vx)
  const flying = airborne(p)
  if (sprout.value) {
    sprout.value.rotation.z = Math.sin(elapsed * 4) * 0.1 - p.vx * 0.025
    sprout.value.rotation.x = -stride * 0.22
  }
  const lift = flying ? (p.vy > 0 ? -0.22 : 0.32) : 0
  LEAVES.forEach((leaf, index) => {
    const node = leaves.items[index]
    if (node) node.rotation.z = leaf.rotation[2] + lift + Math.sin(elapsed * 6 + index * 1.7) * 0.05 * (0.4 + stride)
  })
}, PRIORITY.models)
</script>

<template>
  <TresGroup ref="sprout" :position="[0, gear.sproutY, 0]">
    <TresMesh :geometry="gear.stem" :material="gear.stemSkin" cast-shadow />
    <TresGroup
      v-for="(leaf, index) in LEAVES"
      :key="leaf.scale"
      :ref="leaves.refAt(index)"
      :position="[0, gear.leafY, 0]"
      :rotation="leaf.rotation"
      :scale="leaf.scale"
    >
      <TresMesh :geometry="gear.leaf" :material="gear.leafSkin" cast-shadow>
        <TresMesh :geometry="gear.leaf" :material="gear.leafOutline" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>

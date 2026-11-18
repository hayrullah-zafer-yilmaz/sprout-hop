<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { strideOf } from '../../../scene/hero'
import { getBunGear } from '../../../scene/heroGear'
import { PRIORITY, useWorld } from '../../../scene/context'
import { nodeList } from '../../../scene/nodes'
import { airborne } from './pose'

const gear = getBunGear()
const EARS = [
  { side: -1, x: -0.09, droop: 0.05 },
  { side: 1, x: 0.09, droop: 0.22 },
]
const REST_TILT = 0.2
const GLIDE_TILT = 1.25

const world = useWorld()
const ears = nodeList<Group>()
let spread = 0

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed, delta }) => {
  const p = world.player
  const stride = strideOf(p.vx)
  const flying = airborne(p)
  spread += ((p.gliding ? 1 : 0) - spread) * (1 - Math.exp(-Math.min(delta, 0.1) * 12))
  const flap = p.gliding ? Math.sin(elapsed * 18) * 0.25 : 0
  const sway = Math.sin(elapsed * 3) * 0.06
  EARS.forEach(({ side, droop }, index) => {
    const ear = ears.items[index]
    if (!ear) return
    ear.rotation.z = Math.PI / 2 - side * (REST_TILT + (GLIDE_TILT - REST_TILT) * spread + flap) + sway
    ear.rotation.x = -stride * 0.45 - (flying && !p.gliding ? 0.35 : 0) - droop * (1 - spread)
  })
}, PRIORITY.models)
</script>

<template>
  <TresGroup v-for="(ear, index) in EARS" :key="ear.side" :ref="ears.refAt(index)" :position="[ear.x, gear.earY, 0]">
    <TresMesh :geometry="gear.ear" :material="gear.earSkin" cast-shadow>
      <TresMesh :geometry="gear.ear" :material="gear.earOutline" />
    </TresMesh>
  </TresGroup>
</template>

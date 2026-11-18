<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { HERO, strideOf } from '../../../scene/hero'
import { getBunGear } from '../../../scene/heroGear'
import { PRIORITY, useWorld } from '../../../scene/context'
import { nodeList } from '../../../scene/nodes'
import { airborne } from './pose'

const gear = getBunGear()
const EARS = [
  { side: -1, x: -0.13, bend: 0.18 },
  { side: 1, x: 0.13, bend: 0.62 },
]
const REST_TILT = 0.2
const GLIDE_TILT = 1.25

const world = useWorld()
const ears = nodeList<Group>()
const tips = nodeList<Group>()
let spread = 0

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed, delta }) => {
  const p = world.player
  const stride = strideOf(p.vx)
  const flying = airborne(p)
  spread += ((p.gliding ? 1 : 0) - spread) * (1 - Math.exp(-Math.min(delta, 0.1) * 12))
  const flap = p.gliding ? Math.sin(elapsed * 18) * 0.25 : 0
  const sway = Math.sin(elapsed * 3) * 0.06
  EARS.forEach(({ side, bend }, index) => {
    const ear = ears.items[index]
    const tip = tips.items[index]
    if (ear) {
      ear.rotation.z = -side * (REST_TILT + (GLIDE_TILT - REST_TILT) * spread + flap) + sway
      ear.rotation.x = -stride * 0.45 - (flying && !p.gliding ? 0.35 : 0)
    }
    if (tip) tip.rotation.x = bend * (1 - spread) - stride * 0.35 - (flying ? 0.3 : 0) + Math.sin(elapsed * 5 + index) * 0.05
  })
}, PRIORITY.models)
</script>

<template>
  <TresGroup v-for="(ear, index) in EARS" :key="ear.side" :ref="ears.refAt(index)" :position="[ear.x, gear.earY, -0.02]">
    <TresMesh :geometry="gear.ear" :material="gear.fur" :scale="[1, 1, 0.62]" cast-shadow>
      <TresMesh :geometry="gear.ear" :material="gear.furOutline" />
    </TresMesh>
    <TresMesh :geometry="gear.inner" :material="gear.pink" :position="[0, 0, 0.032]" :scale="[1, 1, 0.42]" />
    <TresGroup :ref="tips.refAt(index)" :position="[0, 0.3, 0]">
      <TresMesh :geometry="gear.earTip" :material="gear.fur" :scale="[1, 1, 0.62]" cast-shadow>
        <TresMesh :geometry="gear.earTip" :material="gear.furOutline" />
      </TresMesh>
      <TresMesh :geometry="gear.innerTip" :material="gear.pink" :position="[0, 0, 0.03]" :scale="[1, 1, 0.42]" />
    </TresGroup>
  </TresGroup>
  <TresMesh :geometry="gear.tail" :material="gear.tailSkin" :position="[0, HERO.center - 0.2, -0.39]" cast-shadow>
    <TresMesh :geometry="gear.tail" :material="gear.furOutline" />
  </TresMesh>
</template>

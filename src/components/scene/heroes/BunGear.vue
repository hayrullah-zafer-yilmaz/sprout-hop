<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { HERO, strideOf } from '../../../scene/hero'
import { PRIORITY, useWorld } from '../../../scene/context'
import { nodeList } from '../../../scene/nodes'

const { center: CENTER } = HERO
const EARS = [
  { side: -1, x: -0.13 },
  { side: 1, x: 0.13 },
]
const REST_TILT = 0.2
const GLIDE_TILT = 1.25

const world = useWorld()
const ears = nodeList<Group>()
let spread = 0

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed, delta }) => {
  const p = world.player
  const target = p.gliding ? 1 : 0
  spread += (target - spread) * (1 - Math.exp(-Math.min(delta, 0.1) * 12))
  const flap = p.gliding ? Math.sin(elapsed * 18) * 0.25 : 0
  const sway = Math.sin(elapsed * 3) * 0.06
  EARS.forEach(({ side }, index) => {
    const ear = ears.items[index]
    if (!ear) return
    const tilt = REST_TILT + (GLIDE_TILT - REST_TILT) * spread
    ear.rotation.z = -side * (tilt + flap) + sway
    ear.rotation.x = -strideOf(p.vx) * 0.45 - (p.onGround || p.gliding ? 0 : 0.35)
  })
}, PRIORITY.models)
</script>

<template>
  <TresGroup v-for="(ear, index) in EARS" :key="ear.side" :ref="ears.refAt(index)" :position="[ear.x, CENTER + 0.34, -0.02]">
    <TresMesh :position="[0, 0.26, 0]" :scale="[1, 1, 0.6]" cast-shadow>
      <TresCapsuleGeometry :args="[0.075, 0.36, 4, 12]" />
      <TresMeshStandardMaterial color="#fff1e2" :roughness="0.5" />
    </TresMesh>
    <TresMesh :position="[0, 0.26, 0.035]" :scale="[1, 1, 0.4]">
      <TresCapsuleGeometry :args="[0.042, 0.27, 4, 10]" />
      <TresMeshStandardMaterial color="#ffb3c7" :roughness="0.6" />
    </TresMesh>
  </TresGroup>
  <TresMesh :position="[0, CENTER - 0.035, 0.415]" :scale="[1.3, 0.9, 0.6]">
    <TresSphereGeometry :args="[0.032, 10, 8]" />
    <TresMeshStandardMaterial color="#ff8fab" :roughness="0.4" />
  </TresMesh>
  <TresMesh :position="[0, CENTER - 0.22, -0.39]" cast-shadow>
    <TresIcosahedronGeometry :args="[0.1, 1]" />
    <TresMeshStandardMaterial color="#ffffff" :roughness="0.8" flat-shading />
  </TresMesh>
</template>

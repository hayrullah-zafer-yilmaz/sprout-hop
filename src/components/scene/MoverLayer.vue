<script setup lang="ts">
import type { Group } from 'three'
import { useLoop } from '@tresjs/core'
import { PRIORITY, useWorld } from '../../scene/context'
import { nodeList } from '../../scene/nodes'

const STRIPES = [-1, 0, 1]
const LAMPS = [-1.35, 1.35]
const BLINK_RATE = 6

const world = useWorld()
const platforms = nodeList<Group>()
const lamps = nodeList<Group>()

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  world.movers.forEach((mover, index) => {
    platforms.items[index]?.position.set(mover.x + mover.w / 2, mover.y + mover.h / 2, 0)
    const lamp = lamps.items[index]
    if (lamp) lamp.visible = mover.wait <= 0 || Math.floor(elapsed * BLINK_RATE) % 2 === 0
  })
}, PRIORITY.models)
</script>

<template>
  <TresGroup
    v-for="(mover, index) in world.movers"
    :key="index"
    :ref="platforms.refAt(index)"
    :position="[mover.x + mover.w / 2, mover.y + mover.h / 2, 0]"
  >
    <TresMesh cast-shadow receive-shadow :position="[0, -0.05, 0]">
      <TresBoxGeometry :args="[3, 0.4, 1.6]" />
      <TresMeshStandardMaterial color="#3d6fc4" :roughness="0.5" :metalness="0.2" />
    </TresMesh>
    <TresMesh receive-shadow :position="[0, 0.2, 0]">
      <TresBoxGeometry :args="[3.02, 0.1, 1.62]" />
      <TresMeshStandardMaterial color="#9cc0f5" :roughness="0.6" />
    </TresMesh>
    <TresMesh v-for="x in STRIPES" :key="x" :position="[x, -0.05, 0.81]">
      <TresBoxGeometry :args="[0.5, 0.12, 0.02]" />
      <TresMeshStandardMaterial color="#f4f7fb" :roughness="0.4" />
    </TresMesh>
    <TresGroup :ref="lamps.refAt(index)">
      <TresMesh v-for="x in LAMPS" :key="x" :position="[x, -0.05, 0.82]">
        <TresSphereGeometry :args="[0.07, 12, 8]" />
        <TresMeshStandardMaterial color="#ffd23f" emissive="#ffb000" :emissive-intensity="1.6" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>

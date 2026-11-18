<script setup lang="ts">
import type { Group, Object3D } from 'three'
import { useLoop } from '@tresjs/core'
import type { Enemy } from '../../game/entities'
import { slimeParts as slime, spikyParts as spiky } from '../../scene/assets'
import { PRIORITY, useWorld } from '../../scene/context'
import { nodeList } from '../../scene/nodes'

const TURN_ANGLE = 0.55
const TURN_RATE = 10

const world = useWorld()
const bodies = nodeList<Group>()
const rollers = nodeList<Object3D>()

function animate(enemy: Enemy, node: Group, index: number, elapsed: number, dt: number): void {
  node.position.set(enemy.x + enemy.w / 2, enemy.y, 0)
  if (enemy.squashed) {
    node.scale.set(1.35, 0.22, 1.35)
    return
  }
  if (enemy.flipped) {
    node.rotation.z = Math.PI
    node.position.y += enemy.h
    return
  }
  node.rotation.y += (enemy.dir * TURN_ANGLE - node.rotation.y) * (1 - Math.exp(-dt * TURN_RATE))
  if (enemy.kind === 'slime') {
    const wobble = Math.sin(elapsed * 9 + index * 1.7)
    node.scale.set(1 + wobble * 0.06, 1 - wobble * 0.08, 1 + wobble * 0.06)
    return
  }
  const roller = rollers.items[index]
  if (roller) roller.rotation.z = -enemy.x / 0.4
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed, delta }) => {
  const dt = Math.min(delta, 0.1)
  world.enemies.forEach((enemy, index) => {
    const node = bodies.items[index]
    if (!node) return
    node.visible = !enemy.gone
    if (!enemy.gone) animate(enemy, node, index, elapsed, dt)
  })
}, PRIORITY.models)
</script>

<template>
  <TresGroup
    v-for="(enemy, index) in world.enemies"
    :key="index"
    :ref="bodies.refAt(index)"
    :position="[enemy.x + enemy.w / 2, enemy.y, 0]"
  >
    <template v-if="enemy.kind === 'slime'">
      <TresMesh :geometry="slime.body" :material="slime.skin" cast-shadow />
      <TresMesh :geometry="slime.shine" :material="slime.gloss" />
      <TresMesh :geometry="slime.eyes" :material="slime.eyeWhite" />
      <TresMesh :geometry="slime.pupils" :material="slime.pupil" />
    </template>
    <template v-else>
      <TresGroup :ref="rollers.refAt(index)" :position="[0, spiky.rollHeight, 0]">
        <TresMesh :geometry="spiky.body" :material="spiky.shell" cast-shadow />
        <TresMesh :geometry="spiky.spikes" :material="spiky.spike" cast-shadow />
      </TresGroup>
      <TresMesh :geometry="spiky.eyes" :material="spiky.eyeWhite" />
      <TresMesh :geometry="spiky.pupils" :material="spiky.pupil" />
      <TresMesh :geometry="spiky.brows" :material="spiky.brow" />
    </template>
  </TresGroup>
</template>

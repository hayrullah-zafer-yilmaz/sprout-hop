<script setup lang="ts">
import type { Group, Object3D } from 'three'
import { useLoop } from '@tresjs/core'
import type { Enemy } from '../../game/entities'
import { burrParts as burr, slugParts as slug } from '../../scene/assets'
import { PRIORITY, useWorld } from '../../scene/context'
import { nodeList } from '../../scene/nodes'

const TURN = { burr: 0.55, slug: 0.45, rate: 10 }
const CRAWL = { speed: 7, stretch: 0.08 }
const BOUNCE = { rate: 2.6, height: 0.05 }

const world = useWorld()
const bodies = nodeList<Group>()
const rollers = nodeList<Object3D>()
const stalks = nodeList<Object3D>()

function heading(enemy: Enemy): number {
  if (enemy.kind === 'burr') return enemy.dir * TURN.burr
  return enemy.dir > 0 ? -TURN.slug : -Math.PI + TURN.slug
}

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
  node.rotation.y += (heading(enemy) - node.rotation.y) * (1 - Math.exp(-dt * TURN.rate))
  if (enemy.kind === 'slug') {
    const crawl = Math.sin(elapsed * CRAWL.speed + index * 1.7)
    node.scale.set(1 + crawl * CRAWL.stretch, 1 - crawl * CRAWL.stretch * 0.7, 1)
    stalks.items[index]?.rotation.set(Math.sin(elapsed * 3 + index) * 0.12, 0, Math.sin(elapsed * 5 + index * 0.7) * 0.15 - crawl * 0.08)
    return
  }
  const roller = rollers.items[index]
  if (roller) roller.rotation.z = -enemy.x / burr.rollHeight
  node.position.y += Math.abs(Math.sin(enemy.x * BOUNCE.rate)) * BOUNCE.height
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
    <template v-if="enemy.kind === 'slug'">
      <TresMesh :geometry="slug.body" :material="slug.skin" cast-shadow>
        <TresMesh :geometry="slug.hull" :material="slug.outline" />
      </TresMesh>
      <TresGroup :ref="stalks.refAt(index)" :position="slug.stalkPivot">
        <TresMesh :geometry="slug.stalks" :material="slug.skin" cast-shadow>
          <TresMesh :geometry="slug.stalks" :material="slug.fineOutline" />
        </TresMesh>
      </TresGroup>
    </template>
    <template v-else>
      <TresGroup :ref="rollers.refAt(index)" :position="[0, burr.rollHeight, 0]">
        <TresMesh :geometry="burr.pod" :material="burr.skin" cast-shadow>
          <TresMesh :geometry="burr.pod" :material="burr.outline" />
        </TresMesh>
      </TresGroup>
      <TresMesh :geometry="burr.face" :material="burr.faceSkin" :position="[0, burr.rollHeight, 0]" />
    </template>
  </TresGroup>
</template>

<script setup lang="ts">
import { InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import { markRaw, onBeforeUnmount } from 'vue'
import { useLoop } from '@tresjs/core'
import { coinParts } from '../../scene/assets'
import { PRIORITY, useWorld } from '../../scene/context'

const COLLECT_TIME = 0.3
const UP = new Vector3(0, 1, 0)

const world = useWorld()
const rims = markRaw(new InstancedMesh(coinParts.rim, coinParts.gold, world.coins.length))
const faces = markRaw(new InstancedMesh(coinParts.face, coinParts.goldLight, world.coins.length))
rims.castShadow = true
rims.frustumCulled = false
faces.frustumCulled = false

const matrix = new Matrix4()
const position = new Vector3()
const rotation = new Quaternion()
const scale = new Vector3()

function place(index: number, x: number, y: number, angle: number, size: number): void {
  matrix.compose(position.set(x, y, 0), rotation.setFromAxisAngle(UP, angle), scale.setScalar(size))
  rims.setMatrixAt(index, matrix)
  faces.setMatrixAt(index, matrix)
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  world.coins.forEach((coin, index) => {
    const x = coin.x + 0.5
    const y = coin.y + 0.5
    if (!coin.collected) {
      place(index, x, y + Math.sin(elapsed * 2.2 + coin.x) * 0.05, elapsed * 2.4 + coin.x * 0.35, 1)
      return
    }
    const progress = (world.clock - coin.collectedAt) / COLLECT_TIME
    place(index, x, y + progress * 0.9, progress * 10, progress < 1 ? 1 + progress * 0.5 : 0)
  })
  rims.instanceMatrix.needsUpdate = true
  faces.instanceMatrix.needsUpdate = true
}, PRIORITY.models)

onBeforeUnmount(() => {
  rims.dispose()
  faces.dispose()
})
</script>

<template>
  <primitive :object="rims" />
  <primitive :object="faces" />
</template>

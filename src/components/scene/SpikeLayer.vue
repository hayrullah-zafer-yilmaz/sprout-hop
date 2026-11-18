<script setup lang="ts">
import { InstancedMesh, Object3D } from 'three'
import { markRaw, onBeforeUnmount } from 'vue'
import { spikeParts } from '../../scene/assets'
import { useWorld } from '../../scene/context'

const OFFSETS_X = [-0.3, 0, 0.3]
const OFFSETS_Z = [-0.5, 0, 0.5]

const world = useWorld()
const conesPerTile = OFFSETS_X.length * OFFSETS_Z.length
const cones = markRaw(new InstancedMesh(spikeParts.cone, spikeParts.steel, Math.max(1, world.spikes.length * conesPerTile)))
const plates = markRaw(new InstancedMesh(spikeParts.plate, spikeParts.base, Math.max(1, world.spikes.length)))
cones.count = world.spikes.length * conesPerTile
plates.count = world.spikes.length
cones.castShadow = true
plates.receiveShadow = true

const dummy = new Object3D()
let index = 0
world.spikes.forEach((spikes, tile) => {
  const centerX = spikes.x + spikes.w / 2
  dummy.position.set(centerX, spikes.y, 0)
  dummy.updateMatrix()
  plates.setMatrixAt(tile, dummy.matrix)
  for (const dx of OFFSETS_X) {
    for (const dz of OFFSETS_Z) {
      dummy.position.set(centerX + dx, spikes.y, dz)
      dummy.updateMatrix()
      cones.setMatrixAt(index++, dummy.matrix)
    }
  }
})
cones.computeBoundingSphere()
plates.computeBoundingSphere()

onBeforeUnmount(() => {
  cones.dispose()
  plates.dispose()
})
</script>

<template>
  <primitive :object="plates" />
  <primitive :object="cones" />
</template>

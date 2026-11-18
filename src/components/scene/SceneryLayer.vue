<script setup lang="ts">
import { markRaw, onBeforeUnmount } from 'vue'
import { dispose, useLoop } from '@tresjs/core'
import type { LevelData } from '../../game/level'
import { Backdrop, buildDecorations } from '../../scene/scenery'
import { PRIORITY } from '../../scene/context'

const props = defineProps<{ level: LevelData }>()

const backdrop = markRaw(new Backdrop(props.level))
const decorations = markRaw(buildDecorations(props.level))

const { onBeforeRender } = useLoop()
onBeforeRender(({ camera, delta }) => backdrop.update(camera.value, delta), PRIORITY.backdrop)

onBeforeUnmount(() => {
  dispose(backdrop.group)
  dispose(decorations)
})
</script>

<template>
  <TresFog :args="['#d6ecff', 45, 210]" />
  <TresHemisphereLight :args="['#e3f2ff', '#5b7a3c', 1.5]" />
  <primitive :object="backdrop.group" />
  <primitive :object="decorations" />
</template>

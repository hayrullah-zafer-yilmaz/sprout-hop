<script setup lang="ts">
import { markRaw, onBeforeUnmount } from 'vue'
import { dispose, useLoop } from '@tresjs/core'
import type { LevelData } from '../../game/level'
import { Backdrop, buildDecorations } from '../../scene/scenery'
import { PRIORITY } from '../../scene/context'
import type { Theme } from '../../scene/themes'

const props = defineProps<{ level: LevelData; theme: Theme }>()

const backdrop = markRaw(new Backdrop(props.level, props.theme))
const decorations = markRaw(buildDecorations(props.level, props.theme.decor, props.theme.seeds.decor))

const { onBeforeRender } = useLoop()
onBeforeRender(({ camera, delta }) => backdrop.update(camera.value, delta), PRIORITY.backdrop)

onBeforeUnmount(() => {
  dispose(backdrop.group)
  dispose(decorations)
})
</script>

<template>
  <TresFog :args="[theme.fog.color, theme.fog.near, theme.fog.far]" />
  <TresHemisphereLight :args="[theme.hemisphere.sky, theme.hemisphere.ground, theme.hemisphere.intensity]" />
  <primitive :object="backdrop.group" />
  <primitive :object="decorations" />
</template>

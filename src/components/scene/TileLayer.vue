<script setup lang="ts">
import { markRaw, onBeforeUnmount } from 'vue'
import { useLoop } from '@tresjs/core'
import { TileMap } from '../../scene/tilemap'
import { PRIORITY, useWorld } from '../../scene/context'

const tiles = markRaw(new TileMap(useWorld()))

const { onBeforeRender } = useLoop()
onBeforeRender(() => tiles.update(), PRIORITY.models)
onBeforeUnmount(() => tiles.dispose())
</script>

<template>
  <primitive :object="tiles.group" />
</template>

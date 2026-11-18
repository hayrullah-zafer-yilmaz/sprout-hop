<script setup lang="ts">
import { markRaw } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { ACESFilmicToneMapping, PCFShadowMap } from 'three'
import { LEVEL_ONE, parseLevel } from '../../game/level'
import { ui } from '../../app/store'
import SceneryLayer from './SceneryLayer.vue'
import LevelScene from './LevelScene.vue'

const level = markRaw(parseLevel(LEVEL_ONE))
</script>

<template>
  <TresCanvas
    clear-color="#8cc8ff"
    shadows
    antialias
    power-preference="high-performance"
    :shadow-map-type="PCFShadowMap"
    :tone-mapping="ACESFilmicToneMapping"
    :tone-mapping-exposure="1.05"
    :dpr="[1, 2]"
  >
    <SceneryLayer :level="level" />
    <LevelScene :key="ui.run" :level="level" />
  </TresCanvas>
</template>

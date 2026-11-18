<script setup lang="ts">
import { computed, markRaw } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { ACESFilmicToneMapping, PCFShadowMap } from 'three'
import { loadLevel } from '../../game/levels'
import { ui } from '../../app/store'
import { THEMES } from '../../scene/themes'
import SceneryLayer from './SceneryLayer.vue'
import LevelScene from './LevelScene.vue'

const level = computed(() => markRaw(loadLevel(ui.level)))
const theme = computed(() => THEMES[ui.level])
</script>

<template>
  <TresCanvas
    :clear-color="theme.sky[1]"
    shadows
    antialias
    power-preference="high-performance"
    :shadow-map-type="PCFShadowMap"
    :tone-mapping="ACESFilmicToneMapping"
    :tone-mapping-exposure="1.05"
    :dpr="[1, 2]"
  >
    <SceneryLayer :key="ui.level" :level="level" :theme="theme" />
    <LevelScene :key="ui.run" :level="level" :theme="theme" />
  </TresCanvas>
</template>

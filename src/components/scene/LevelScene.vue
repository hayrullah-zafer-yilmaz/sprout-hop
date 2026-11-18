<script setup lang="ts">
import { markRaw, onBeforeUnmount, provide, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import type { GameEvent } from '../../game/entities'
import type { LevelData } from '../../game/level'
import { World } from '../../game/world'
import { sounds } from '../../app/audio'
import { input } from '../../app/input'
import { endGame, finishLevel, syncHud, ui } from '../../app/store'
import { PRIORITY, THEME_KEY, WORLD_KEY } from '../../scene/context'
import type { Theme } from '../../scene/themes'
import CameraRig from './CameraRig.vue'
import TileLayer from './TileLayer.vue'
import CoinLayer from './CoinLayer.vue'
import SpikeLayer from './SpikeLayer.vue'
import MoverLayer from './MoverLayer.vue'
import EnemyLayer from './EnemyLayer.vue'
import CheckpointLayer from './CheckpointLayer.vue'
import GoalFlag from './GoalFlag.vue'
import EffectLayer from './EffectLayer.vue'
import RockLayer from './RockLayer.vue'
import LavaLayer from './LavaLayer.vue'
import PlayerModel from './PlayerModel.vue'

const MAX_FRAME_TIME = 1 / 20
const MAX_STEP = 1 / 120

const props = defineProps<{ level: LevelData; theme: Theme }>()

const world = markRaw(new World(props.level, { character: ui.character }))
provide(WORLD_KEY, world)
provide(THEME_KEY, props.theme)
watch(
  () => ui.character,
  (character) => world.setCharacter(character),
)
ui.totalCoins = world.totalCoins
if (import.meta.env.DEV) Object.assign(window, { sproutHop: world })

function onGameEvent(event: GameEvent): void {
  sounds.play(event, event === 'crash' ? 0.35 + world.quake * 0.65 : 1)
  if (event === 'complete') finishLevel(world.score)
  if (event === 'gameover') endGame()
}

const stopListening = world.on(onGameEvent)
onBeforeUnmount(stopListening)

function advance(dt: number): void {
  const state = input.read()
  const steps = Math.ceil(dt / MAX_STEP)
  for (let i = 0; i < steps; i++) {
    world.step(dt / steps, state)
    state.jumpPressed = false
  }
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  input.update()
  if (ui.screen === 'playing') advance(Math.min(delta, MAX_FRAME_TIME))
  syncHud(world)
}, PRIORITY.world)
</script>

<template>
  <CameraRig />
  <TileLayer />
  <SpikeLayer />
  <CoinLayer />
  <MoverLayer />
  <EnemyLayer />
  <CheckpointLayer />
  <GoalFlag />
  <EffectLayer />
  <RockLayer v-if="world.rocks.length > 0" />
  <LavaLayer v-if="theme.lava !== null" :surface="theme.lava" />
  <PlayerModel />
</template>

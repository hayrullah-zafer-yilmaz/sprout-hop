<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import GameCanvas from './components/scene/GameCanvas.vue'
import GameHud from './components/ui/GameHud.vue'
import GameOverlay from './components/ui/GameOverlay.vue'
import { input, type Action } from './app/input'
import {
  backToTitle,
  cycleHero,
  cycleLevel,
  openHeroSelect,
  pauseIfPlaying,
  restart,
  startGame,
  toggleMute,
  togglePause,
  ui,
  type Screen,
} from './app/store'

const IN_RUN: Screen[] = ['playing', 'paused', 'gameover', 'complete']

function confirm(): void {
  if (ui.screen === 'title') openHeroSelect()
  else if (ui.screen === 'select') startGame()
  else if (ui.screen === 'paused') togglePause()
  else if (ui.screen === 'gameover' || ui.screen === 'complete') restart()
}

function handle(action: Action): void {
  switch (action) {
    case 'confirm':
      confirm()
      break
    case 'pause':
      if (ui.screen === 'select') backToTitle()
      else togglePause()
      break
    case 'blur':
      pauseIfPlaying()
      break
    case 'restart':
      if (IN_RUN.includes(ui.screen)) restart()
      break
    case 'mute':
      toggleMute()
      break
    case 'left':
    case 'right':
      if (ui.screen === 'select') cycleHero(action === 'left' ? -1 : 1)
      break
    case 'up':
    case 'down':
      if (ui.screen === 'select') cycleLevel(action === 'up' ? -1 : 1)
      break
  }
}

let detach: (() => void) | undefined
let unsubscribe: (() => void) | undefined

onMounted(() => {
  document.documentElement.lang = ui.locale
  detach = input.attach(window)
  unsubscribe = input.onAction(handle)
})

onBeforeUnmount(() => {
  detach?.()
  unsubscribe?.()
})
</script>

<template>
  <main class="stage">
    <GameCanvas />
    <GameHud v-if="IN_RUN.includes(ui.screen)" />
    <GameOverlay />
  </main>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  overflow: hidden;
}
</style>

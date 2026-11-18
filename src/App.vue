<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import GameCanvas from './components/scene/GameCanvas.vue'
import GameHud from './components/ui/GameHud.vue'
import GameOverlay from './components/ui/GameOverlay.vue'
import { input, type Action } from './app/input'
import { pauseIfPlaying, restart, startGame, toggleMute, togglePause, ui } from './app/store'

function handle(action: Action): void {
  switch (action) {
    case 'confirm':
      if (ui.screen === 'title') startGame()
      else if (ui.screen === 'paused') togglePause()
      else if (ui.screen === 'gameover' || ui.screen === 'complete') restart()
      break
    case 'pause':
      togglePause()
      break
    case 'blur':
      pauseIfPlaying()
      break
    case 'restart':
      if (ui.screen !== 'title') restart()
      break
    case 'mute':
      toggleMute()
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
    <GameHud v-if="ui.screen !== 'title'" />
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

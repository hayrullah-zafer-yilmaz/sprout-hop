<script setup lang="ts">
import { ui } from '../../app/store'
import TitleScreen from './TitleScreen.vue'
import CharacterSelect from './CharacterSelect.vue'
import PauseMenu from './PauseMenu.vue'
import ResultScreen from './ResultScreen.vue'
</script>

<template>
  <Transition name="fade">
    <div v-if="ui.screen !== 'playing'" class="overlay" :class="`overlay-${ui.screen}`">
      <TitleScreen v-if="ui.screen === 'title'" />
      <CharacterSelect v-else-if="ui.screen === 'select'" />
      <PauseMenu v-else-if="ui.screen === 'paused'" />
      <ResultScreen v-else :outcome="ui.screen" />
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(ellipse at center, rgba(11, 31, 56, 0.35), rgba(11, 31, 56, 0.7));
  overflow: auto;
}

.overlay-title,
.overlay-select {
  background: linear-gradient(90deg, rgba(11, 31, 56, 0.82) 0%, rgba(11, 31, 56, 0.55) 45%, rgba(11, 31, 56, 0.1) 100%);
  place-items: center start;
  padding-left: clamp(24px, 6vw, 96px);
}

.overlay-select {
  background: linear-gradient(90deg, rgba(11, 31, 56, 0.85) 0%, rgba(11, 31, 56, 0.6) 40%, rgba(11, 31, 56, 0) 60%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .overlay-title,
  .overlay-select {
    place-items: start center;
    padding: 16px;
  }
}
</style>

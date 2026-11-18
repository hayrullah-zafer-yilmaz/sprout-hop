<script setup lang="ts">
import { changeHero, levelName, restart, t, togglePause } from '../../app/store'
import { vAutofocus } from './autofocus'
</script>

<template>
  <section class="panel panel-wide" aria-labelledby="pause-title">
    <h1 id="pause-title">{{ t.paused }}</h1>
    <p class="lead">{{ t.pausedText(levelName) }}</p>
    <div class="actions">
      <button v-autofocus class="button button-primary" type="button" @click="togglePause">{{ t.resume }}</button>
      <button class="button button-ghost" type="button" @click="restart">{{ t.restart }}</button>
      <button class="button button-ghost" type="button" @click="changeHero">{{ t.changeHero }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { restart, t, togglePause } from '../../app/store'
import { vAutofocus } from './autofocus'
</script>

<template>
  <section class="panel" aria-labelledby="pause-title">
    <h1 id="pause-title">{{ t.paused }}</h1>
    <p class="lead">{{ t.pausedText }}</p>
    <div class="actions">
      <button v-autofocus class="button button-primary" type="button" @click="togglePause">{{ t.resume }}</button>
      <button class="button button-ghost" type="button" @click="restart">{{ t.restart }}</button>
    </div>
  </section>
</template>

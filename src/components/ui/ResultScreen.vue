<script setup lang="ts">
import { computed } from 'vue'
import { formatScore } from '../../app/format'
import { best, changeHero, playNextLevel, restart, t, ui, upcomingLevel } from '../../app/store'
import { vAutofocus } from './autofocus'

const props = defineProps<{ outcome: 'gameover' | 'complete' }>()

const advance = computed(() => props.outcome === 'complete' && upcomingLevel.value !== null)

const copy = computed(() => {
  if (props.outcome === 'gameover') return { title: t.value.gameOver, text: t.value.gameOverText }
  return { title: t.value.complete, text: advance.value ? t.value.completeText : t.value.finalText }
})

const stats = computed(() => {
  const score = { label: t.value.score, value: formatScore(ui.score) }
  const coins = { label: t.value.coins, value: `${ui.coins} / ${ui.totalCoins}` }
  const lives = { label: t.value.lives, value: String(ui.lives) }
  const record = { label: t.value.best, value: formatScore(best.value) }
  return props.outcome === 'complete' ? [score, coins, lives, record] : [score, coins, record]
})
</script>

<template>
  <section class="panel" aria-labelledby="result-title">
    <span v-if="outcome === 'complete' && ui.newBest" class="badge">{{ t.newBest }}</span>
    <h1 id="result-title">{{ copy.title }}</h1>
    <p class="lead">{{ copy.text }}</p>
    <dl class="stats" :class="{ 'stats-three': stats.length === 3 }">
      <div v-for="stat in stats" :key="stat.label">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>
    <div class="actions">
      <button v-if="advance" v-autofocus class="button button-primary" type="button" @click="playNextLevel">{{ t.nextLevel }}</button>
      <button v-autofocus="!advance" class="button" :class="advance ? 'button-ghost' : 'button-primary'" type="button" @click="restart">
        {{ outcome === 'gameover' ? t.tryAgain : t.playAgain }}
      </button>
      <button class="button button-ghost" type="button" @click="changeHero">{{ t.changeHero }}</button>
    </div>
  </section>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 20px 0 0;
}

.stats-three {
  grid-template-columns: repeat(3, 1fr);
}

.stats div {
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(157, 179, 209, 0.14);
}

.stats dt {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.stats dd {
  margin: 4px 0 0;
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.badge {
  display: inline-block;
  margin-bottom: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(255, 197, 49, 0.18);
  border: 1px solid rgba(255, 197, 49, 0.5);
  color: #ffd166;
  font-size: 12px;
  font-weight: 700;
}
</style>

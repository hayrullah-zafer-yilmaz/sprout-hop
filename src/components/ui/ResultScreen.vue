<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatScore } from '../../app/format'
import { best, changeHero, levelName, playNextLevel, restart, t, ui, upcomingLevel } from '../../app/store'
import { vAutofocus } from './autofocus'
import { useCountdown } from './countdown'

const NEXT_LEVEL_DELAY = 5

const props = defineProps<{ outcome: 'gameover' | 'complete' }>()

const advance = computed(() => props.outcome === 'complete' && upcomingLevel.value !== null)
const nextButton = ref<HTMLButtonElement>()
const { progress, running, stop } = useCountdown(NEXT_LEVEL_DELAY, advance.value, playNextLevel)

const copy = computed(() => {
  if (props.outcome === 'gameover') return { title: t.value.gameOver, text: t.value.gameOverText }
  return { title: t.value.complete, text: advance.value ? t.value.completeText(levelName.value) : t.value.finalText }
})

const notice = computed(() => {
  const next = upcomingLevel.value
  if (!next) return ''
  const seconds = Math.max(1, Math.ceil(NEXT_LEVEL_DELAY * (1 - progress.value)))
  return t.value.startsIn(t.value.levelNames[next], seconds)
})

function keepChoice(event: FocusEvent): void {
  if (event.target !== nextButton.value) stop()
}

const stats = computed(() => {
  const score = { label: t.value.score, value: formatScore(ui.score) }
  const coins = { label: t.value.coins, value: `${ui.coins} / ${ui.totalCoins}` }
  const lives = { label: t.value.lives, value: String(ui.lives) }
  const record = { label: t.value.best, value: formatScore(best.value) }
  return props.outcome === 'complete' ? [score, coins, lives, record] : [score, coins, record]
})
</script>

<template>
  <section class="panel" :class="{ 'panel-wide': advance }" aria-labelledby="result-title">
    <span v-if="outcome === 'complete' && ui.newBest" class="badge">{{ t.newBest }}</span>
    <h1 id="result-title">{{ copy.title }}</h1>
    <p class="lead">{{ copy.text }}</p>
    <dl class="stats" :class="{ 'stats-three': stats.length === 3 }">
      <div v-for="stat in stats" :key="stat.label">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>
    <p v-if="advance" class="notice" :class="{ 'notice-off': !running }">{{ notice }}</p>
    <div class="actions" @focusin="keepChoice">
      <button
        v-if="advance"
        ref="nextButton"
        v-autofocus
        class="button button-primary button-next"
        :style="{ '--progress': running ? progress : 0 }"
        type="button"
        @click="playNextLevel"
      >
        {{ t.nextLevel }}
      </button>
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

.notice {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.notice-off {
  visibility: hidden;
}

.notice + .actions {
  margin-top: 12px;
}

.button-next {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.button-next::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(255, 255, 255, 0.24);
  transform: scaleX(var(--progress, 0));
  transform-origin: left center;
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

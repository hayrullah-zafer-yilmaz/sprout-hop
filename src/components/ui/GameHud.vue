<script setup lang="ts">
import { computed } from 'vue'
import { formatScore } from '../../app/format'
import { t, togglePause, toggleMute, ui } from '../../app/store'
import CharacterPortrait from './CharacterPortrait.vue'

const score = computed(() => formatScore(ui.score))
const lowTime = computed(() => ui.time <= 60 && ui.screen === 'playing')
</script>

<template>
  <header class="hud">
    <div class="hud-group">
      <div class="stat stat-score">
        <span class="label">{{ t.score }}</span>
        <span class="value">{{ score }}</span>
      </div>
      <div class="stat" :aria-label="t.coins">
        <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#ffc531" />
          <circle cx="12" cy="12" r="5.5" fill="none" stroke="#b97a17" stroke-width="2" />
        </svg>
        <span class="value">{{ ui.coins }}<span class="dim"> / {{ ui.totalCoins }}</span></span>
      </div>
      <div class="stat" :aria-label="t.lives">
        <CharacterPortrait :character="ui.character" class="icon icon-hero" />
        <span class="value">× {{ ui.lives }}</span>
      </div>
      <div class="stat" :class="{ warn: lowTime }" :aria-label="t.time">
        <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
          <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M12 9v4l2.5 2M10 3h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span class="value">{{ ui.time }}</span>
      </div>
    </div>
    <div class="hud-group">
      <span class="level">{{ t.level }}</span>
      <button class="icon-button" type="button" :aria-label="ui.muted ? t.soundOff : t.soundOn" :title="`${t.sound} (M)`" @click="toggleMute">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4Z" fill="currentColor" />
          <path v-if="!ui.muted" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path v-else d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <button class="icon-button" type="button" :aria-label="t.pause" :title="`${t.pause} (Esc)`" @click="togglePause">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
          <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.hud {
  position: absolute;
  inset: 16px 16px auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.hud-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat,
.level,
.icon-button {
  height: 40px;
  border-radius: 8px;
  background: rgba(11, 31, 56, 0.74);
  border: 1px solid rgba(157, 179, 209, 0.18);
  backdrop-filter: blur(6px);
  color: var(--text);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  font-variant-numeric: tabular-nums;
}

.stat-score {
  gap: 10px;
}

.label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.value {
  white-space: nowrap;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.dim {
  color: var(--muted);
  font-weight: 600;
}

.icon {
  width: 20px;
  height: 20px;
  flex: none;
}

.icon-hero {
  width: 24px;
  height: 24px;
}

.warn {
  color: #ffd166;
  border-color: rgba(255, 209, 102, 0.5);
}

.level {
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.icon-button {
  width: 40px;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.15s, border-color 0.15s;
}

.icon-button:hover {
  background: rgba(47, 111, 222, 0.85);
  border-color: rgba(157, 196, 255, 0.5);
}

.icon-button:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.icon-button svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 760px) {
  .level {
    display: none;
  }
}

@media (max-width: 640px) {
  .hud {
    inset: 10px 10px auto;
    align-items: flex-start;
    gap: 6px;
  }

  .hud-group {
    flex-wrap: wrap;
    gap: 6px;
  }

  .stat,
  .icon-button {
    height: 34px;
  }

  .stat {
    padding: 0 10px;
    gap: 6px;
  }

  .icon-button {
    width: 34px;
  }

  .label {
    display: none;
  }

  .value {
    font-size: 14px;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}
</style>

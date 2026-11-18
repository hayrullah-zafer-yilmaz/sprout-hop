<script setup lang="ts">
import { computed } from 'vue'
import { formatScore } from '../../app/format'
import type { Locale } from '../../app/i18n'
import { openHeroSelect, setLocale, t, toggleMute, ui } from '../../app/store'
import CharacterPortrait from './CharacterPortrait.vue'
import { vAutofocus } from './autofocus'

const LOCALES: { id: Locale; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'tr', label: 'TR' },
]

const touchScreen = window.matchMedia('(pointer: coarse)').matches

const controls = computed(() => [
  { label: t.value.move, keys: [['←', '→'], ['A', 'D']] },
  { label: t.value.jump, keys: [['Space'], ['W'], ['↑']] },
  { label: t.value.run, keys: [['Shift']] },
  { label: t.value.pause, keys: [['Esc'], ['P']] },
  { label: t.value.restart, keys: [['R']] },
  { label: t.value.sound, keys: [['M']] },
])
</script>

<template>
  <section class="panel panel-wide" aria-labelledby="title">
    <div class="brand">
      <CharacterPortrait character="sprout" class="mark" />
      <div>
        <h1 id="title">Sprout Hop</h1>
        <p class="lead">{{ t.tagline }}</p>
      </div>
    </div>

    <div class="start">
      <div>
        <span class="eyebrow">{{ t.level }}</span>
        <p class="hint">{{ t.startHint }}</p>
      </div>
      <button v-autofocus class="button button-primary" type="button" @click="openHeroSelect">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7Z" fill="currentColor" /></svg>
        {{ t.play }}
      </button>
    </div>

    <div class="card">
      <h2>{{ t.controls }}</h2>
      <dl class="controls">
        <template v-for="row in controls" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd>
            <template v-for="(group, groupIndex) in row.keys" :key="groupIndex">
              <span v-if="groupIndex > 0" class="or">{{ t.or }}</span>
              <kbd v-for="key in group" :key="key">{{ key }}</kbd>
            </template>
          </dd>
        </template>
      </dl>
      <p class="note">{{ t.gamepad }}</p>
    </div>

    <p v-if="touchScreen" class="notice">{{ t.touchNotice }}</p>
    <p class="note">{{ t.tip }}</p>

    <footer class="footer">
      <div class="segmented" role="group" :aria-label="t.language">
        <button
          v-for="locale in LOCALES"
          :key="locale.id"
          type="button"
          :class="{ active: ui.locale === locale.id }"
          :aria-pressed="ui.locale === locale.id"
          @click="setLocale(locale.id)"
        >
          {{ locale.label }}
        </button>
      </div>
      <button class="button button-ghost" type="button" @click="toggleMute">
        {{ ui.muted ? t.soundOff : t.soundOn }}
      </button>
      <span v-if="ui.best > 0" class="best">{{ t.best }}: {{ formatScore(ui.best) }}</span>
      <span class="built">{{ t.builtWith }}</span>
    </footer>
  </section>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

.mark {
  width: 56px;
  height: 56px;
  flex: none;
}

.brand h1 {
  font-size: 40px;
  line-height: 1;
}

h2 {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.start {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  margin-bottom: 14px;
  border-radius: 8px;
  background: rgba(47, 111, 222, 0.16);
  border: 1px solid rgba(47, 111, 222, 0.45);
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9cc0f5;
}

.hint {
  margin: 4px 0 0;
  font-size: 14px;
}

.card {
  padding: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(157, 179, 209, 0.14);
}

.controls {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  margin: 0;
  font-size: 14px;
}

.controls dt {
  color: var(--muted);
}

.controls dd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 0;
}

kbd {
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  display: inline-grid;
  place-items: center;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(157, 179, 209, 0.3);
  border-bottom-width: 2px;
  font: 600 12px/1 var(--font);
  color: var(--text);
}

.or {
  margin: 0 4px;
  font-size: 12px;
  color: var(--muted);
}

.notice {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(255, 197, 49, 0.12);
  border: 1px solid rgba(255, 197, 49, 0.4);
  color: #ffe08a;
  font-size: 13px;
  line-height: 1.5;
}

.note {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(157, 179, 209, 0.14);
  font-size: 12px;
  color: var(--muted);
}

.best {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--text);
}

.built {
  margin-left: auto;
}

.segmented {
  display: inline-flex;
  padding: 3px;
  gap: 3px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(157, 179, 209, 0.3);
}

.segmented button {
  height: 32px;
  min-width: 40px;
  padding: 0 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--muted);
  font: 600 14px/1 var(--font);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.segmented button.active {
  background: var(--blue);
  color: #fff;
}

.segmented button:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .brand h1 {
    font-size: 32px;
  }

  .built {
    margin-left: 0;
  }
}
</style>

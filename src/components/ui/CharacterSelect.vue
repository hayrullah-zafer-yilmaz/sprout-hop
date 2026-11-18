<script setup lang="ts">
import { computed, ref } from 'vue'
import { CHARACTER_IDS, CHARACTERS } from '../../game/characters'
import { LEVEL_IDS, levelNumber } from '../../game/levels'
import { backToTitle, chooseHero, chooseLevel, startGame, t, ui } from '../../app/store'
import CharacterPortrait from './CharacterPortrait.vue'
import { vAutofocus } from './autofocus'
import { useRovingFocus } from './roving'

const RATING_MAX = 3

const roster = ref<HTMLElement>()
const levels = ref<HTMLElement>()
const heroFocus = useRovingFocus(roster, () => ui.character)
const levelFocus = useRovingFocus(levels, () => ui.level)

const hero = computed(() => CHARACTERS[ui.character])
const copy = computed(() => t.value.heroes[ui.character])
const ratings = computed(() => [
  { label: t.value.speed, value: hero.value.rating.speed },
  { label: t.value.jumpPower, value: hero.value.rating.jump },
])

</script>

<template>
  <section class="panel panel-wide" aria-labelledby="select-title">
    <h1 id="select-title">{{ t.chooseHero }}</h1>
    <p class="lead">{{ t.chooseHint }}</p>

    <div ref="roster" class="roster" role="radiogroup" :aria-label="t.chooseHero">
      <button
        v-for="id in CHARACTER_IDS"
        :key="id"
        :ref="heroFocus.bind(id)"
        type="button"
        role="radio"
        class="hero"
        :class="{ active: ui.character === id }"
        :aria-checked="ui.character === id"
        :tabindex="ui.character === id ? 0 : -1"
        @click="chooseHero(id)"
      >
        <CharacterPortrait :character="id" class="portrait" />
        <span class="name">{{ CHARACTERS[id].name }}</span>
        <span class="trait">{{ t.heroes[id].trait }}</span>
      </button>
    </div>

    <div class="details">
      <p class="description">{{ copy.description }}</p>
      <dl class="ratings">
        <div v-for="rating in ratings" :key="rating.label" class="rating">
          <dt>{{ rating.label }}</dt>
          <dd :aria-label="`${rating.value} / ${RATING_MAX}`">
            <span v-for="step in RATING_MAX" :key="step" class="pip" :class="{ on: step <= rating.value }" aria-hidden="true" />
          </dd>
        </div>
      </dl>
    </div>

    <h2 class="section">{{ t.levelPicker }}</h2>
    <div ref="levels" class="levels" role="radiogroup" :aria-label="t.levelPicker">
      <button
        v-for="id in LEVEL_IDS"
        :key="id"
        :ref="levelFocus.bind(id)"
        type="button"
        role="radio"
        class="level"
        :class="{ active: ui.level === id }"
        :aria-checked="ui.level === id"
        :tabindex="ui.level === id ? 0 : -1"
        @click="chooseLevel(id)"
      >
        <span class="number">{{ levelNumber(id) }}</span>
        <span class="level-name">{{ t.levelNames[id] }}</span>
      </button>
    </div>

    <div class="actions">
      <button v-autofocus class="button button-primary" type="button" @click="startGame">{{ t.start }}</button>
      <button class="button button-ghost" type="button" @click="backToTitle">{{ t.back }}</button>
    </div>
  </section>
</template>

<style scoped>
.roster {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 20px;
}

.hero {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 14px 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(157, 179, 209, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.hero:hover {
  background: rgba(255, 255, 255, 0.08);
}

.hero.active {
  border-color: #4a86f0;
  background: rgba(47, 111, 222, 0.22);
}

.hero:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.portrait {
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
}

.name {
  font-size: 15px;
  font-weight: 800;
}

.trait {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.hero.active .trait {
  color: #9cc0f5;
}

.details {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(157, 179, 209, 0.14);
}

.description {
  margin: 0;
  min-height: 3em;
  font-size: 14px;
  line-height: 1.5;
}

.ratings {
  display: flex;
  gap: 28px;
  margin: 12px 0 0;
}

.rating {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rating dt {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.rating dd {
  display: flex;
  gap: 4px;
  margin: 0;
}

.pip {
  width: 22px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.14);
}

.pip.on {
  background: var(--blue);
}

.section {
  margin: 16px 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.levels {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.level {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px 10px;
  text-align: left;
  line-height: 1.2;
  border-radius: 8px;
  border: 1px solid rgba(157, 179, 209, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font: 600 14px/1 var(--font);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.level:hover {
  background: rgba(255, 255, 255, 0.08);
}

.level.active {
  border-color: #4a86f0;
  background: rgba(47, 111, 222, 0.22);
}

.level:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.number {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
  font-weight: 800;
}

.level.active .number {
  background: var(--blue);
}
</style>

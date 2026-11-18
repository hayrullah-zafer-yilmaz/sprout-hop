<script setup lang="ts">
import { computed, useId } from 'vue'
import type { CharacterId } from '../../game/characters'
import { HERO_LOOKS } from '../../scene/hero'

const props = defineProps<{ character: CharacterId }>()

const TONES: Record<CharacterId, { light: string; dark: string; collarLight: string; collarDark: string }> = {
  sprout: { light: '#ffb684', dark: '#c4581f', collarLight: '#ffc596', collarDark: '#d9773a' },
  zip: { light: '#fff09a', dark: '#e8a210', collarLight: '#ffd27a', collarDark: '#d48706' },
  bun: { light: '#ffffff', dark: '#e6cdb8', collarLight: '#ffdbe6', collarDark: '#e48ea9' },
}
const LEAVES: Record<CharacterId, { light: string; dark: string; vein: string; edge: string }> = {
  sprout: { light: '#9be774', dark: '#45a83f', vein: '#d2f7a8', edge: '#1d6a2b' },
  zip: { light: '#a8ea74', dark: '#4aa83a', vein: '#e0f9b4', edge: '#1d6a2b' },
  bun: { light: '#c8edb8', dark: '#7cbf6c', vein: '#eefbe4', edge: '#4a8544' },
}
const BELLY = 'M14.6 31C10.6 37.4 11.2 49.2 20.6 55.4Q32 58.8 43.4 55.4C52.8 49.2 53.4 37.4 49.4 31Z'
const EYE = { y: 40.4, gap: 7.4, rx: 4.9, ry: 5.9 }
const SIDES = [-1, 1] as const
const FRECKLES = [
  [-1.4, -0.4],
  [0, 0.8],
  [1.4, -0.4],
]

const uid = useId()
const ids = {
  body: `${uid}-body`,
  collar: `${uid}-collar`,
  iris: `${uid}-iris`,
  blush: `${uid}-blush`,
  leaf: `${uid}-leaf`,
  lens: `${uid}-lens`,
  clip: `${uid}-clip`,
}

const look = computed(() => HERO_LOOKS[props.character])
const tone = computed(() => TONES[props.character])
const leaf = computed(() => LEAVES[props.character])

const mouth = computed(() => {
  const y = EYE.y + 8.2
  if (props.character === 'bun') return `M32 ${y - 1.2}V${y}M29.2 ${y - 0.6}Q30.6 ${y + 1.4} 32 ${y}Q33.4 ${y + 1.4} 34.8 ${y - 0.6}`
  if (props.character === 'zip') return `M28.8 ${y - 0.6}Q31.8 ${y + 2.4} 35.4 ${y - 1.2}`
  return `M29 ${y - 0.7}Q32 ${y + 2.5} 35 ${y - 0.7}`
})

const nose = computed(() => {
  const y = EYE.y + 5.2
  return `M30.2 ${y}Q32 ${y - 0.9} 33.8 ${y}Q33.5 ${y + 1.5} 32 ${y + 2}Q30.5 ${y + 1.5} 30.2 ${y}Z`
})

const freckles = computed(() =>
  SIDES.flatMap((side) => FRECKLES.map(([dx, dy], index) => ({ key: `${side}${index}`, x: 32 + side * (13.2 + dx), y: EYE.y + 6.8 + dy }))),
)
</script>

<template>
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <radialGradient :id="ids.body" cx="0.34" cy="0.28" r="0.85">
        <stop offset="0" :stop-color="tone.light" />
        <stop offset="0.5" :stop-color="look.body" />
        <stop offset="1" :stop-color="tone.dark" />
      </radialGradient>
      <linearGradient :id="ids.collar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="tone.collarLight" />
        <stop offset="0.45" :stop-color="look.collar" />
        <stop offset="1" :stop-color="tone.collarDark" />
      </linearGradient>
      <radialGradient :id="ids.iris" cx="0.5" cy="0.85" r="0.85">
        <stop offset="0" :stop-color="look.iris[0]" />
        <stop offset="0.75" :stop-color="look.iris[1]" />
      </radialGradient>
      <radialGradient :id="ids.blush">
        <stop offset="0" :stop-color="look.blush" stop-opacity="0.85" />
        <stop offset="1" :stop-color="look.blush" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="ids.leaf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="leaf.light" />
        <stop offset="1" :stop-color="leaf.dark" />
      </linearGradient>
      <radialGradient v-if="character === 'zip'" :id="ids.lens" cx="0.42" cy="0.38" r="0.7">
        <stop offset="0" stop-color="#c3fbf1" />
        <stop offset="0.55" stop-color="#3ad6c0" />
        <stop offset="1" stop-color="#0d6b63" />
      </radialGradient>
      <clipPath v-if="character === 'zip'" :id="ids.clip">
        <rect x="11.5" y="22.5" width="41" height="9.5" rx="3" />
      </clipPath>
    </defs>

    <g v-if="character === 'sprout'" :stroke="leaf.edge" stroke-width="1.1" stroke-linejoin="round">
      <path d="M32 21V12.6" stroke="#3fa34d" stroke-width="2.4" stroke-linecap="round" />
      <path d="M31.4 13.4C27 6.4 18.4 3.6 12 6.4C15.8 12.6 24.2 15.8 31.4 13.4Z" :fill="`url(#${ids.leaf})`" />
      <path d="M32.6 12.8C36.4 5.2 45.2 1.6 52.2 4.4C49 11.4 40.4 15.2 32.6 12.8Z" :fill="`url(#${ids.leaf})`" />
      <path d="M30.4 12.6Q22.6 7.8 14.2 6.8M33.6 12Q42 6.2 50.2 4.8" fill="none" :stroke="leaf.vein" stroke-width="0.7" />
    </g>
    <g v-else-if="character === 'zip'" :stroke="leaf.edge" stroke-width="1" stroke-linejoin="round" :fill="`url(#${ids.leaf})`">
      <path d="M29.4 21.4Q24.6 14.4 20.6 7.6Q28.8 12.4 31.6 20.6Z" />
      <path d="M33.8 21.2Q37.6 13.6 44.4 9.4Q40.4 16.4 35.8 21.8Z" />
      <path d="M30.6 21.2Q30.4 11.2 33.4 3.4Q36 12.4 33.8 21.2Z" />
    </g>
    <g v-else :stroke="leaf.edge" stroke-width="1.1">
      <g transform="rotate(-13 27 21)">
        <ellipse cx="27" cy="11.4" rx="4.6" ry="10.4" :fill="`url(#${ids.leaf})`" />
        <path d="M27 20V3.4" fill="none" :stroke="leaf.vein" stroke-width="0.8" />
      </g>
      <g transform="rotate(15 37 21)">
        <ellipse cx="37" cy="12.2" rx="4.4" ry="9.6" :fill="`url(#${ids.leaf})`" />
        <path d="M37 20.4V5" fill="none" :stroke="leaf.vein" stroke-width="0.8" />
      </g>
    </g>

    <ellipse cx="32" cy="22.6" rx="16.6" ry="3.8" :fill="look.soil" stroke="#3d2414" stroke-width="0.8" />

    <g :stroke="look.shade" stroke-width="1">
      <g v-for="side in SIDES" :key="`shoe${side}`">
        <ellipse :cx="32 + side * 8.6" cy="58.8" rx="6.6" ry="2.4" :fill="look.shoe.sole" />
        <ellipse :cx="32 + side * 8.6" cy="56.8" rx="6" ry="3.8" :fill="look.shoe.upper" />
        <ellipse v-if="look.shoe.zone === 'toe'" :cx="32 + side * 8.6" cy="58.2" rx="3.8" ry="1.9" :fill="look.shoe.accent" stroke="none" />
      </g>
    </g>
    <ellipse
      v-for="side in SIDES"
      :key="`arm${side}`"
      :cx="32 + side * 19.8"
      cy="44"
      rx="3.7"
      ry="4.9"
      :transform="`rotate(${side * -28} ${32 + side * 19.8} 44)`"
      :fill="look.limbs"
      :stroke="look.shade"
      stroke-width="1.2"
    />
    <path :d="BELLY" :fill="`url(#${ids.body})`" :stroke="look.shade" stroke-width="1.5" stroke-linejoin="round" />
    <g fill="#ffffff">
      <circle cx="17.6" cy="36.4" r="1.4" fill-opacity="0.75" />
      <circle cx="16.6" cy="40" r="0.85" fill-opacity="0.6" />
    </g>

    <rect x="11.5" y="22.5" width="41" height="9.5" rx="3" :fill="`url(#${ids.collar})`" :stroke="look.shade" stroke-width="1.5" />
    <path d="M15.4 24.8H27" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.2" stroke-linecap="round" />

    <g v-if="character === 'zip'">
      <rect x="11.5" y="25.4" width="41" height="3.4" fill="#334155" :clip-path="`url(#${ids.clip})`" />
      <g v-for="side in SIDES" :key="`goggle${side}`">
        <circle :cx="32 + side * 7.2" cy="26.6" r="4.7" fill="#4b5563" stroke="#0f172a" stroke-width="1.1" />
        <circle :cx="32 + side * 7.2" cy="26.6" r="3.5" :fill="`url(#${ids.lens})`" />
        <path
          :d="`M${29.8 + side * 7.2} 27.6L${32.6 + side * 7.2} 24L${33.6 + side * 7.2} 24.6L${30.8 + side * 7.2} 28.2Z`"
          fill="#ffffff"
          fill-opacity="0.85"
        />
      </g>
    </g>

    <ellipse v-for="side in SIDES" :key="`cheek${side}`" :cx="32 + side * 13.2" :cy="EYE.y + 6.8" rx="3.8" ry="2.3" :fill="`url(#${ids.blush})`" />
    <g v-if="character === 'zip'" fill="#c2620f" fill-opacity="0.8">
      <circle v-for="dot in freckles" :key="dot.key" :cx="dot.x" :cy="dot.y" r="0.55" />
    </g>
    <g v-for="side in SIDES" :key="`eye${side}`">
      <ellipse :cx="32 + side * EYE.gap" :cy="EYE.y" :rx="EYE.rx" :ry="EYE.ry" fill="#ffffff" :stroke="look.ink" stroke-width="1.2" />
      <ellipse :cx="32 + side * EYE.gap" :cy="EYE.y + 0.6" :rx="EYE.rx * 0.84" :ry="EYE.ry * 0.84" :fill="`url(#${ids.iris})`" />
      <ellipse :cx="32 + side * EYE.gap" :cy="EYE.y + 0.4" rx="2.3" ry="2.9" fill="#06040a" fill-opacity="0.85" />
      <ellipse :cx="32 + side * EYE.gap - 1.3" :cy="EYE.y - 1.6" rx="1.7" ry="1.45" fill="#ffffff" />
      <circle :cx="32 + side * EYE.gap + 1.7" :cy="EYE.y + 2.4" r="0.75" fill="#ffffff" />
    </g>
    <path v-if="character === 'bun'" :d="nose" fill="#ff7ea6" :stroke="look.ink" stroke-width="0.6" />
    <path :d="mouth" fill="none" :stroke="look.ink" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

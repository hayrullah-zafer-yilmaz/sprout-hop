<script setup lang="ts">
import { computed, useId } from 'vue'
import type { CharacterId } from '../../game/characters'
import { HERO_LOOKS } from '../../scene/hero'

const props = defineProps<{ character: CharacterId }>()

const TONES: Record<CharacterId, { light: string; dark: string }> = {
  sprout: { light: '#ffc27a', dark: '#df6519' },
  zip: { light: '#fff09a', dark: '#eea514' },
  bun: { light: '#ffffff', dark: '#e9d0bd' },
}
const BODY = { cx: 32, cy: 35, r: 21 }
const EYE = { gap: 7, rx: 4.8, ry: 6.2 }
const SIDES = [-1, 1] as const
const FRECKLES = [
  [-1.4, -0.4],
  [0, 0.8],
  [1.4, -0.4],
]

const uid = useId()
const ids = {
  body: `${uid}-body`,
  iris: `${uid}-iris`,
  blush: `${uid}-blush`,
  clip: `${uid}-clip`,
  lens: `${uid}-lens`,
  knit: `${uid}-knit`,
  leaf: `${uid}-leaf`,
}

const look = computed(() => HERO_LOOKS[props.character])
const tone = computed(() => TONES[props.character])
const eyeY = computed(() => (props.character === 'zip' ? 34.4 : 33))

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function point(cx: number, cy: number, rx: number, ry: number, degrees: number): [number, number] {
  const angle = (degrees * Math.PI) / 180
  return [round(cx + Math.cos(angle) * rx), round(cy + Math.sin(angle) * ry)]
}

const eyes = computed(() =>
  SIDES.map((side) => {
    const cx = BODY.cx + side * EYE.gap
    const cy = eyeY.value
    const [x1, y1] = point(cx, cy, EYE.rx, EYE.ry, 198)
    const [x2, y2] = point(cx, cy, EYE.rx, EYE.ry, 342)
    const [ox, oy] = side < 0 ? [x1, y1] : [x2, y2]
    return { side, cx, cy, lash: `M${x1} ${y1}A${EYE.rx} ${EYE.ry} 0 0 1 ${x2} ${y2}M${ox} ${oy}q${side} -0.2 ${side * 1.9} -1.6` }
  }),
)

const rim = computed(() => {
  const radius = BODY.r - 2.4
  const [x1, y1] = point(BODY.cx, BODY.cy, radius, radius, 196)
  const [x2, y2] = point(BODY.cx, BODY.cy, radius, radius, 244)
  return `M${x1} ${y1}A${radius} ${radius} 0 0 1 ${x2} ${y2}`
})

const mouth = computed(() => {
  const y = eyeY.value + 8.6
  if (props.character === 'bun') return `M32 ${y - 1.4}V${y - 0.2}M29 ${y - 0.7}Q30.5 ${y + 1.4} 32 ${y - 0.2}Q33.5 ${y + 1.4} 35 ${y - 0.7}`
  if (props.character === 'zip') return `M28.4 ${y - 0.6}Q31.6 ${y + 2.6} 35.6 ${y - 1.4}`
  return `M28.6 ${y - 0.8}Q32 ${y + 2.8} 35.4 ${y - 0.8}`
})

const nose = computed(() => {
  const y = eyeY.value + 5.2
  return `M30 ${y}Q32 ${y - 1} 34 ${y}Q33.7 ${y + 1.6} 32 ${y + 2.2}Q30.3 ${y + 1.6} 30 ${y}Z`
})

const freckles = computed(() =>
  SIDES.flatMap((side) =>
    FRECKLES.map(([dx, dy], index) => ({ key: `${side}${index}`, x: 32 + side * (13.4 + dx), y: eyeY.value + 7.2 + dy })),
  ),
)
</script>

<template>
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <radialGradient :id="ids.body" cx="0.36" cy="0.3" r="0.8">
        <stop offset="0" :stop-color="tone.light" />
        <stop offset="0.55" :stop-color="look.body" />
        <stop offset="1" :stop-color="tone.dark" />
      </radialGradient>
      <radialGradient :id="ids.iris" cx="0.5" cy="0.8" r="0.8">
        <stop offset="0" :stop-color="look.iris[0]" />
        <stop offset="1" :stop-color="look.iris[1]" />
      </radialGradient>
      <radialGradient :id="ids.blush">
        <stop offset="0" :stop-color="look.blush" stop-opacity="0.85" />
        <stop offset="1" :stop-color="look.blush" stop-opacity="0" />
      </radialGradient>
      <clipPath :id="ids.clip">
        <circle :cx="BODY.cx" :cy="BODY.cy" :r="BODY.r" />
      </clipPath>
      <radialGradient v-if="character === 'zip'" :id="ids.lens" cx="0.42" cy="0.38" r="0.7">
        <stop offset="0" stop-color="#c3fbf1" />
        <stop offset="0.55" stop-color="#3ad6c0" />
        <stop offset="1" stop-color="#0d6b63" />
      </radialGradient>
      <pattern v-if="character === 'sprout'" :id="ids.knit" width="3" height="3" patternUnits="userSpaceOnUse">
        <path d="M0 0.4L1.5 1.9L3 0.4" fill="none" stroke="#2659bd" stroke-width="0.8" />
      </pattern>
      <linearGradient v-if="character === 'sprout'" :id="ids.leaf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7fe08a" />
        <stop offset="1" stop-color="#3fb54f" />
      </linearGradient>
    </defs>

    <g v-if="character === 'sprout'" stroke="#1d6a2b" stroke-width="1.1" stroke-linejoin="round">
      <path d="M32 15.5V10.6" stroke="#2f9e44" stroke-width="2.2" stroke-linecap="round" />
      <path d="M31.6 10.9C28.8 6 23.2 4.6 18.6 6.6C21.6 11.1 27 12.3 31.6 10.9Z" :fill="`url(#${ids.leaf})`" />
      <path d="M32.4 10.5C35.4 4.6 42 2.6 47.2 5.1C44.2 10.2 37.8 11.7 32.4 10.5Z" :fill="`url(#${ids.leaf})`" />
      <path d="M30.4 10.2Q25.6 8 21 7.2M33.6 9.6Q39 6.6 44.6 5.6" fill="none" stroke="#2f9e44" stroke-width="0.6" />
    </g>
    <g v-else-if="character === 'zip'" fill="#f5b301" stroke="#a86d05" stroke-width="1.1" stroke-linejoin="round">
      <path d="M27.6 17L21.4 7.4L31 13.6Z" />
      <path d="M29.8 14.4L32.6 2.6L35.8 14.2Z" />
      <path d="M35.4 14.6L43.8 8L39.2 17.2Z" />
    </g>
    <g v-else :stroke="look.shade" stroke-width="1.2">
      <g transform="rotate(-12 24 22)">
        <ellipse cx="24" cy="11" rx="5.6" ry="12" :fill="`url(#${ids.body})`" />
        <ellipse cx="24" cy="12" rx="2.7" ry="8.4" fill="#ffb0c7" stroke="none" />
      </g>
      <g transform="rotate(12 40 22)">
        <ellipse cx="40" cy="14.4" rx="5.4" ry="8.8" :fill="`url(#${ids.body})`" />
        <ellipse cx="40" cy="15.2" rx="2.5" ry="5.8" fill="#ffb0c7" stroke="none" />
        <ellipse cx="44" cy="7.4" rx="6" ry="3.4" transform="rotate(28 44 7.4)" :fill="`url(#${ids.body})`" />
      </g>
    </g>

    <g :stroke="look.shade" stroke-width="1">
      <g v-for="side in SIDES" :key="`shoe${side}`">
        <ellipse :cx="32 + side * 9" cy="58.6" rx="7.8" ry="2.5" :fill="look.shoe.sole" />
        <ellipse :cx="32 + side * 9" cy="56.3" rx="7.2" ry="4.3" :fill="look.shoe.upper" />
        <ellipse v-if="look.shoe.zone === 'toe'" :cx="32 + side * 9" cy="58" rx="4.4" ry="2.1" :fill="look.shoe.accent" stroke="none" />
      </g>
    </g>
    <ellipse
      v-for="side in SIDES"
      :key="`arm${side}`"
      :cx="32 + side * 20.6"
      cy="39.5"
      rx="4.3"
      ry="5.4"
      :transform="`rotate(${side * -30} ${32 + side * 20.6} 39.5)`"
      :fill="look.limbs"
      :stroke="look.shade"
      stroke-width="1.2"
    />
    <circle :cx="BODY.cx" :cy="BODY.cy" :r="BODY.r" :fill="`url(#${ids.body})`" :stroke="look.shade" stroke-width="1.5" />
    <path :d="rim" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.4" stroke-linecap="round" />

    <g v-if="character === 'sprout'">
      <g :clip-path="`url(#${ids.clip})`">
        <rect x="8" y="44.6" width="48" height="6.6" fill="#2f6fde" />
        <rect x="8" y="44.6" width="48" height="6.6" :fill="`url(#${ids.knit})`" />
        <path d="M8 44.6H56M8 51.2H56" stroke="#163a80" stroke-width="1" />
      </g>
      <g fill="#2f6fde" stroke="#163a80" stroke-width="0.9">
        <rect x="48.4" y="48.6" width="3.6" height="7.6" rx="1.4" transform="rotate(-16 50.2 48.6)" />
        <rect x="50.6" y="48.6" width="3.4" height="6" rx="1.3" transform="rotate(10 52.3 48.6)" />
        <circle cx="50.6" cy="47.8" r="2.8" />
      </g>
    </g>
    <g v-else-if="character === 'zip'">
      <rect x="8" y="19.6" width="48" height="4.8" fill="#334155" :clip-path="`url(#${ids.clip})`" />
      <g v-for="side in SIDES" :key="`goggle${side}`">
        <circle :cx="32 + side * 7" cy="22" r="5.5" fill="#4b5563" stroke="#0f172a" stroke-width="1.1" />
        <circle :cx="32 + side * 7" cy="22" r="4.1" :fill="`url(#${ids.lens})`" />
        <path
          :d="`M${29.4 + side * 7} 23.2L${32.6 + side * 7} 19L${33.8 + side * 7} 19.7L${30.6 + side * 7} 23.9Z`"
          fill="#ffffff"
          fill-opacity="0.85"
        />
      </g>
    </g>

    <ellipse
      v-for="side in SIDES"
      :key="`cheek${side}`"
      :cx="32 + side * 13.4"
      :cy="eyeY + 7.2"
      rx="4.4"
      ry="2.6"
      :fill="`url(#${ids.blush})`"
    />
    <g v-if="character === 'zip'" fill="#c2620f" fill-opacity="0.8">
      <circle v-for="dot in freckles" :key="dot.key" :cx="dot.x" :cy="dot.y" r="0.6" />
    </g>
    <g v-for="eye in eyes" :key="`eye${eye.side}`">
      <ellipse :cx="eye.cx" :cy="eye.cy" :rx="EYE.rx" :ry="EYE.ry" fill="#ffffff" :stroke="look.ink" stroke-width="1.1" />
      <ellipse :cx="eye.cx" :cy="eye.cy + 0.9" :rx="EYE.rx * 0.78" :ry="EYE.ry * 0.76" :fill="`url(#${ids.iris})`" />
      <ellipse :cx="eye.cx" :cy="eye.cy + 1.2" rx="1.8" ry="2.45" fill="#0a1020" />
      <circle :cx="eye.cx - 1.3" :cy="eye.cy - 0.9" r="1.3" fill="#ffffff" />
      <circle :cx="eye.cx + 1.4" :cy="eye.cy + 3.1" r="0.6" fill="#ffffff" />
      <path :d="eye.lash" fill="none" :stroke="look.ink" stroke-width="1.7" stroke-linecap="round" />
    </g>
    <path v-if="character === 'bun'" :d="nose" fill="#ff7ea6" :stroke="look.ink" stroke-width="0.6" />
    <path :d="mouth" fill="none" :stroke="look.ink" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

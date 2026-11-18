<script setup lang="ts">
import { useId } from 'vue'
import type { CharacterId } from '../../game/characters'

defineProps<{ character: CharacterId }>()

const clipId = useId()
</script>

<template>
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <clipPath :id="clipId"><circle cx="32" cy="34" r="22" /></clipPath>
    </defs>

    <template v-if="character === 'sprout'">
      <path d="M32 13V9" stroke="#2f9e44" stroke-width="2.5" stroke-linecap="round" />
      <path d="M32 10C30 4 24 2 19 4c3 6 8 7 13 6Z" fill="#51cf66" />
      <path d="M32 10c2-6 8-8 13-6-3 6-8 7-13 6Z" fill="#51cf66" />
      <circle cx="32" cy="34" r="22" fill="#ff9a3c" />
      <rect x="8" y="44" width="48" height="5" fill="#2f6fde" :clip-path="`url(#${clipId})`" />
      <ellipse cx="25" cy="30" rx="5" ry="6" fill="#fff" />
      <ellipse cx="39" cy="30" rx="5" ry="6" fill="#fff" />
      <circle cx="25.5" cy="31" r="3" fill="#13233a" />
      <circle cx="39.5" cy="31" r="3" fill="#13233a" />
      <circle cx="26.6" cy="29.6" r="1" fill="#fff" />
      <circle cx="40.6" cy="29.6" r="1" fill="#fff" />
      <ellipse cx="17.5" cy="38" rx="3.5" ry="2" fill="#ff7f8f" />
      <ellipse cx="46.5" cy="38" rx="3.5" ry="2" fill="#ff7f8f" />
      <path d="M29.5 38.5q2.5 2.5 5 0" stroke="#6b2a12" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <ellipse cx="22" cy="57" rx="7.5" ry="4" fill="#6b3f22" />
      <ellipse cx="42" cy="57" rx="7.5" ry="4" fill="#6b3f22" />
    </template>

    <template v-else-if="character === 'zip'">
      <path d="M26 15 20 5l9 7Z" fill="#f4b400" />
      <path d="M30 13 32 1l4 12Z" fill="#f4b400" />
      <path d="M35 13l9-7-4 10Z" fill="#f4b400" />
      <circle cx="32" cy="34" r="22" fill="#ffd84d" />
      <rect x="8" y="19" width="48" height="5" fill="#334155" :clip-path="`url(#${clipId})`" />
      <circle cx="25" cy="21.5" r="6.2" fill="#5eead4" stroke="#334155" stroke-width="2.4" />
      <circle cx="39" cy="21.5" r="6.2" fill="#5eead4" stroke="#334155" stroke-width="2.4" />
      <path d="M22 20a3.5 3.5 0 0 1 3-2.5M36 20a3.5 3.5 0 0 1 3-2.5" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" />
      <ellipse cx="25" cy="34" rx="4.6" ry="5.4" fill="#fff" />
      <ellipse cx="39" cy="34" rx="4.6" ry="5.4" fill="#fff" />
      <circle cx="25.4" cy="35" r="2.7" fill="#13233a" />
      <circle cx="39.4" cy="35" r="2.7" fill="#13233a" />
      <circle cx="26.4" cy="33.6" r="0.9" fill="#fff" />
      <circle cx="40.4" cy="33.6" r="0.9" fill="#fff" />
      <ellipse cx="17.5" cy="41" rx="3.5" ry="2" fill="#ff7f8f" />
      <ellipse cx="46.5" cy="41" rx="3.5" ry="2" fill="#ff7f8f" />
      <path d="M29.5 41.5q2.5 2.5 5 0" stroke="#6b2a12" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <ellipse cx="22" cy="57" rx="7.5" ry="4" fill="#e5484d" />
      <ellipse cx="42" cy="57" rx="7.5" ry="4" fill="#e5484d" />
      <path d="M16 59h12M36 59h12" stroke="#fff" stroke-width="1.6" stroke-linecap="round" />
    </template>

    <template v-else>
      <g transform="rotate(-14 24 22)">
        <ellipse cx="24" cy="11" rx="6.5" ry="13" fill="#fff1e2" stroke="#e3cdb4" stroke-width="1.4" />
        <ellipse cx="24" cy="12" rx="3" ry="9" fill="#ffb3c7" />
      </g>
      <g transform="rotate(14 40 22)">
        <ellipse cx="40" cy="11" rx="6.5" ry="13" fill="#fff1e2" stroke="#e3cdb4" stroke-width="1.4" />
        <ellipse cx="40" cy="12" rx="3" ry="9" fill="#ffb3c7" />
      </g>
      <circle cx="32" cy="36" r="21" fill="#fff1e2" stroke="#e3cdb4" stroke-width="1.4" />
      <ellipse cx="25" cy="33" rx="4.6" ry="5.4" fill="#fff" stroke="#e3cdb4" stroke-width="0.8" />
      <ellipse cx="39" cy="33" rx="4.6" ry="5.4" fill="#fff" stroke="#e3cdb4" stroke-width="0.8" />
      <circle cx="25.4" cy="34" r="2.8" fill="#13233a" />
      <circle cx="39.4" cy="34" r="2.8" fill="#13233a" />
      <circle cx="26.4" cy="32.6" r="0.9" fill="#fff" />
      <circle cx="40.4" cy="32.6" r="0.9" fill="#fff" />
      <ellipse cx="17.5" cy="40.5" rx="3.5" ry="2" fill="#ffb3c7" />
      <ellipse cx="46.5" cy="40.5" rx="3.5" ry="2" fill="#ffb3c7" />
      <ellipse cx="32" cy="39" rx="1.9" ry="1.4" fill="#ff8fab" />
      <path d="M29.5 41.5q2.5 2.5 5 0" stroke="#6b2a12" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <ellipse cx="22" cy="57.5" rx="7.5" ry="4" fill="#f59fbd" />
      <ellipse cx="42" cy="57.5" rx="7.5" ry="4" fill="#f59fbd" />
    </template>
  </svg>
</template>

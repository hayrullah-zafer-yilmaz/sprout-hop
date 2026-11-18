import { computed, reactive } from 'vue'
import { RULES } from '../game/config'
import type { World } from '../game/world'
import { sounds } from './audio'
import { detectLocale, messages, saveLocale, type Locale } from './i18n'
import { input } from './input'

export type Screen = 'title' | 'playing' | 'paused' | 'gameover' | 'complete'

const BEST_KEY = 'sprout-hop.best'
const MUTE_KEY = 'sprout-hop.muted'

function readNumber(key: string): number {
  if (typeof window === 'undefined') return 0
  const value = Number(window.localStorage.getItem(key))
  return Number.isFinite(value) ? value : 0
}

export const ui = reactive({
  screen: 'title' as Screen,
  run: 0,
  score: 0,
  coins: 0,
  totalCoins: 0,
  lives: RULES.startLives,
  time: RULES.levelTime,
  best: readNumber(BEST_KEY),
  newBest: false,
  muted: typeof window !== 'undefined' && window.localStorage.getItem(MUTE_KEY) === '1',
  locale: detectLocale() as Locale,
})

sounds.setMuted(ui.muted)

export const t = computed(() => messages[ui.locale])

export function setLocale(locale: Locale): void {
  ui.locale = locale
  saveLocale(locale)
}

export function startGame(): void {
  sounds.unlock()
  sounds.play('start')
  input.clear()
  ui.screen = 'playing'
}

export function togglePause(): void {
  if (ui.screen === 'playing') ui.screen = 'paused'
  else if (ui.screen === 'paused') ui.screen = 'playing'
  else return
  sounds.play('pause')
  input.clear()
}

export function pauseIfPlaying(): void {
  if (ui.screen === 'playing') ui.screen = 'paused'
}

export function restart(): void {
  sounds.unlock()
  input.clear()
  ui.run++
  ui.score = 0
  ui.coins = 0
  ui.lives = RULES.startLives
  ui.time = RULES.levelTime
  ui.newBest = false
  ui.screen = 'playing'
}

export function toggleMute(): void {
  ui.muted = !ui.muted
  sounds.unlock()
  sounds.setMuted(ui.muted)
  window.localStorage.setItem(MUTE_KEY, ui.muted ? '1' : '0')
}

export function finishLevel(score: number): void {
  if (score > ui.best) {
    ui.best = score
    ui.newBest = true
    window.localStorage.setItem(BEST_KEY, String(score))
  }
  ui.screen = 'complete'
}

export function endGame(): void {
  ui.screen = 'gameover'
}

export function syncHud(world: World): void {
  if (ui.score !== world.score) ui.score = world.score
  if (ui.coins !== world.coinsCollected) ui.coins = world.coinsCollected
  if (ui.lives !== world.lives) ui.lives = world.lives
  const time = Math.ceil(world.time)
  if (ui.time !== time) ui.time = time
}

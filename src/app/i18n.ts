export type Locale = 'en' | 'tr'

const en = {
  tagline: 'A 2.5D platformer level built with Vue 3 and TresJS',
  level: 'Level 1 · Sunny Meadow',
  play: 'Play',
  startHint: 'Press Enter to start',
  touchNotice: 'Sprout Hop is played with a keyboard or a gamepad. Open it on a computer for the best experience.',
  controls: 'Controls',
  move: 'Move',
  jump: 'Jump',
  run: 'Run',
  pause: 'Pause',
  restart: 'Restart',
  sound: 'Sound',
  or: 'or',
  gamepad: 'Gamepads work too: stick or D-pad to move, A to jump, X to run, Start to pause.',
  tip: 'Hit crates from below, stomp the purple slimes and steer clear of the spiky ones.',
  score: 'Score',
  coins: 'Coins',
  lives: 'Lives',
  time: 'Time',
  paused: 'Paused',
  pausedText: 'Take a breath. The meadow will wait.',
  resume: 'Resume',
  gameOver: 'Game over',
  gameOverText: 'You ran out of lives.',
  tryAgain: 'Try again',
  complete: 'Level complete!',
  completeText: 'You raised the flag at the end of the meadow.',
  best: 'Best',
  newBest: 'New best!',
  playAgain: 'Play again',
  soundOn: 'Sound on',
  soundOff: 'Sound off',
  language: 'Language',
  builtWith: 'Built with Vue 3, TresJS and Three.js',
}

export type Messages = typeof en

const tr: Messages = {
  tagline: 'Vue 3 ve TresJS ile yapılmış 2.5D platform oyunu bölümü',
  level: 'Bölüm 1 · Güneşli Çayır',
  play: 'Oyna',
  startHint: 'Başlamak için Enter tuşuna basın',
  touchNotice: 'Sprout Hop klavye veya oyun kumandasıyla oynanır. En iyi deneyim için bir bilgisayarda açın.',
  controls: 'Kontroller',
  move: 'Hareket',
  jump: 'Zıpla',
  run: 'Koş',
  pause: 'Duraklat',
  restart: 'Yeniden başlat',
  sound: 'Ses',
  or: 'veya',
  gamepad:
    'Oyun kumandası da desteklenir: hareket için analog çubuğu veya yön tuşlarını, zıplamak için A, koşmak için X, duraklatmak için Start tuşunu kullanın.',
  tip: 'Sandıklara alttan vurun, mor jölelerin üstüne basın, dikenlilerden uzak durun.',
  score: 'Puan',
  coins: 'Altın',
  lives: 'Can',
  time: 'Süre',
  paused: 'Duraklatıldı',
  pausedText: 'Biraz soluklanın, çayır sizi bekler.',
  resume: 'Devam et',
  gameOver: 'Oyun bitti',
  gameOverText: 'Canlarınız tükendi.',
  tryAgain: 'Tekrar dene',
  complete: 'Bölüm tamamlandı!',
  completeText: 'Çayırın sonundaki bayrağı göndere çektiniz.',
  best: 'En iyi',
  newBest: 'Yeni rekor!',
  playAgain: 'Tekrar oyna',
  soundOn: 'Ses açık',
  soundOff: 'Ses kapalı',
  language: 'Dil',
  builtWith: 'Vue 3, TresJS ve Three.js ile yapıldı',
}

export const messages: Record<Locale, Messages> = { en, tr }

const STORAGE_KEY = 'sprout-hop.locale'

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const query = new URLSearchParams(window.location.search).get('lang')
  if (query === 'en' || query === 'tr') return query
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'tr') return stored
  return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en'
}

export function saveLocale(locale: Locale): void {
  window.localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

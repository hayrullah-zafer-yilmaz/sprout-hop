import type { GameEvent } from '../game/entities'

type Wave = OscillatorType

interface Note {
  wave: Wave
  from: number
  to?: number
  start: number
  duration: number
  volume: number
}

const NOTE = (semitones: number) => 440 * 2 ** ((semitones - 9) / 12)

type SoundName = GameEvent | 'pause' | 'start' | 'select'

const SOUNDS: Partial<Record<SoundName, Note[]>> = {
  jump: [{ wave: 'square', from: 280, to: 620, start: 0, duration: 0.14, volume: 0.09 }],
  coin: [
    { wave: 'triangle', from: NOTE(24), start: 0, duration: 0.06, volume: 0.22 },
    { wave: 'triangle', from: NOTE(31), start: 0.06, duration: 0.2, volume: 0.2 },
  ],
  stomp: [{ wave: 'triangle', from: 260, to: 70, start: 0, duration: 0.16, volume: 0.35 }],
  bump: [{ wave: 'square', from: 140, to: 90, start: 0, duration: 0.08, volume: 0.12 }],
  life: [12, 16, 19, 24, 28].map((semitone, i) => ({
    wave: 'square' as const,
    from: NOTE(semitone),
    start: i * 0.07,
    duration: 0.1,
    volume: 0.08,
  })),
  checkpoint: [
    { wave: 'triangle', from: NOTE(19), start: 0, duration: 0.1, volume: 0.2 },
    { wave: 'triangle', from: NOTE(24), start: 0.1, duration: 0.22, volume: 0.2 },
  ],
  die: [
    { wave: 'square', from: 520, to: 360, start: 0, duration: 0.18, volume: 0.1 },
    { wave: 'square', from: 360, to: 90, start: 0.22, duration: 0.6, volume: 0.1 },
  ],
  goal: [0, 4, 7, 12, 16, 19, 24].map((semitone, i) => ({
    wave: 'square' as const,
    from: NOTE(12 + semitone),
    start: i * 0.09,
    duration: 0.14,
    volume: 0.07,
  })),
  tally: [{ wave: 'sine', from: 1760, start: 0, duration: 0.03, volume: 0.06 }],
  complete: [
    { wave: 'triangle', from: NOTE(12), start: 0, duration: 0.5, volume: 0.15 },
    { wave: 'triangle', from: NOTE(16), start: 0, duration: 0.5, volume: 0.12 },
    { wave: 'triangle', from: NOTE(19), start: 0, duration: 0.5, volume: 0.12 },
    { wave: 'triangle', from: NOTE(24), start: 0.12, duration: 0.6, volume: 0.12 },
  ],
  gameover: [7, 3, 0, -5].map((semitone, i) => ({
    wave: 'triangle' as const,
    from: NOTE(semitone),
    start: i * 0.22,
    duration: 0.26,
    volume: 0.2,
  })),
  pause: [{ wave: 'sine', from: 880, start: 0, duration: 0.06, volume: 0.12 }],
  select: [
    { wave: 'triangle', from: NOTE(14), start: 0, duration: 0.05, volume: 0.16 },
    { wave: 'triangle', from: NOTE(21), start: 0.05, duration: 0.09, volume: 0.16 },
  ],
  start: [
    { wave: 'triangle', from: NOTE(12), start: 0, duration: 0.08, volume: 0.18 },
    { wave: 'triangle', from: NOTE(19), start: 0.08, duration: 0.16, volume: 0.18 },
  ],
  crash: [{ wave: 'sine', from: 150, to: 38, start: 0, duration: 0.38, volume: 0.5 }],
}

interface Noise {
  duration: number
  cutoff: number
  volume: number
}

const NOISES: Partial<Record<SoundName, Noise>> = {
  break: { duration: 0.25, cutoff: 1400, volume: 0.35 },
  crash: { duration: 0.5, cutoff: 420, volume: 0.55 },
}

export class SoundBoard {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private lastTally = 0
  muted = false

  unlock(): void {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : 0.8
      this.master.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') void this.context.resume()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.master && this.context) this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.context.currentTime, 0.02)
  }

  play(name: SoundName, loudness = 1): void {
    const noise = NOISES[name]
    if (noise) this.noise(noise, loudness)
    const notes = SOUNDS[name]
    if (!notes || !this.context || !this.master || this.muted) return
    if (name === 'tally') {
      if (this.context.currentTime - this.lastTally < 0.05) return
      this.lastTally = this.context.currentTime
    }
    const now = this.context.currentTime
    for (const note of notes) {
      const oscillator = this.context.createOscillator()
      const gain = this.context.createGain()
      oscillator.type = note.wave
      const start = now + note.start
      const end = start + note.duration
      oscillator.frequency.setValueAtTime(note.from, start)
      if (note.to) oscillator.frequency.exponentialRampToValueAtTime(note.to, end)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(note.volume * loudness, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, end)
      oscillator.connect(gain).connect(this.master)
      oscillator.start(start)
      oscillator.stop(end + 0.02)
    }
  }

  private noise({ duration, cutoff, volume }: Noise, loudness: number): void {
    if (!this.context || !this.master || this.muted) return
    const length = Math.floor(this.context.sampleRate * duration)
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    const source = this.context.createBufferSource()
    source.buffer = buffer
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    const gain = this.context.createGain()
    gain.gain.value = volume * loudness
    source.connect(filter).connect(gain).connect(this.master)
    source.start()
  }
}

export const sounds = new SoundBoard()

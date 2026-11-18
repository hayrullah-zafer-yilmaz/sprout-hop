import type { InputState } from '../game/entities'

export type Action = 'confirm' | 'pause' | 'restart' | 'mute' | 'blur'

const KEYS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'ArrowUp', 'KeyW', 'KeyZ', 'KeyK'],
  run: ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyJ'],
}

const SCROLL_KEYS = new Set([...KEYS.left, ...KEYS.right, ...KEYS.jump, 'ArrowDown'])

const ACTION_KEYS: Record<string, Action> = {
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  Escape: 'pause',
  KeyP: 'pause',
  KeyR: 'restart',
  KeyM: 'mute',
}

const PAD_BUTTONS = { jump: 0, runA: 2, runB: 1, start: 9, left: 14, right: 15 }
const STICK_DEADZONE = 0.35

interface PadState {
  axis: number
  jump: boolean
  run: boolean
  start: boolean
}

const IDLE_PAD: PadState = { axis: 0, jump: false, run: false, start: false }

function readGamepad(): PadState {
  const pad = navigator.getGamepads?.().find((item) => item?.connected)
  if (!pad) return IDLE_PAD
  const pressed = (button: number) => pad.buttons[button]?.pressed ?? false
  const dpad = (pressed(PAD_BUTTONS.right) ? 1 : 0) - (pressed(PAD_BUTTONS.left) ? 1 : 0)
  const stick = pad.axes[0] ?? 0
  return {
    axis: dpad || (Math.abs(stick) > STICK_DEADZONE ? Math.sign(stick) : 0),
    jump: pressed(PAD_BUTTONS.jump),
    run: pressed(PAD_BUTTONS.runA) || pressed(PAD_BUTTONS.runB),
    start: pressed(PAD_BUTTONS.start),
  }
}

function pressesFocusedButton(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null
  const clickable = target?.tagName === 'BUTTON' || target?.tagName === 'A'
  return clickable && (event.code === 'Space' || event.code === 'Enter')
}

export class InputController {
  private readonly held = new Set<string>()
  private readonly listeners = new Set<(action: Action) => void>()
  private jumpQueued = false
  private pad: PadState = IDLE_PAD

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || pressesFocusedButton(event)) return
    if (SCROLL_KEYS.has(event.code)) event.preventDefault()
    if (!event.repeat) {
      if (KEYS.jump.includes(event.code)) this.jumpQueued = true
      const action = ACTION_KEYS[event.code]
      if (action) {
        event.preventDefault()
        this.dispatch(action)
      }
    }
    this.held.add(event.code)
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.held.delete(event.code)
  }

  private readonly onBlur = () => {
    this.held.clear()
    this.dispatch('blur')
  }

  attach(target: Window = window): () => void {
    target.addEventListener('keydown', this.onKeyDown)
    target.addEventListener('keyup', this.onKeyUp)
    target.addEventListener('blur', this.onBlur)
    return () => {
      target.removeEventListener('keydown', this.onKeyDown)
      target.removeEventListener('keyup', this.onKeyUp)
      target.removeEventListener('blur', this.onBlur)
    }
  }

  onAction(listener: (action: Action) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  update(): void {
    const previous = this.pad
    this.pad = readGamepad()
    if (this.pad.start && !previous.start) this.dispatch('pause')
    if (this.pad.jump && !previous.jump) {
      this.jumpQueued = true
      this.dispatch('confirm')
    }
  }

  read(): InputState {
    const keyboardAxis = (this.isHeld(KEYS.right) ? 1 : 0) - (this.isHeld(KEYS.left) ? 1 : 0)
    const state: InputState = {
      axis: keyboardAxis || this.pad.axis,
      jump: this.isHeld(KEYS.jump) || this.pad.jump,
      jumpPressed: this.jumpQueued,
      run: this.isHeld(KEYS.run) || this.pad.run,
    }
    this.jumpQueued = false
    return state
  }

  clear(): void {
    this.jumpQueued = false
  }

  private dispatch(action: Action): void {
    for (const listener of this.listeners) listener(action)
  }

  private isHeld(codes: string[]): boolean {
    return codes.some((code) => this.held.has(code))
  }
}

export const input = new InputController()

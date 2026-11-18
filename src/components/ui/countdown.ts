import { onBeforeUnmount, onMounted, ref } from 'vue'

const MAX_STEP_MS = 100

export function useCountdown(seconds: number, enabled: boolean, onDone: () => void) {
  const progress = ref(0)
  const running = ref(enabled)
  let frame = 0
  let last = 0

  const tick = (now: number) => {
    if (last && document.hasFocus()) {
      progress.value = Math.min(1, progress.value + Math.min(now - last, MAX_STEP_MS) / (seconds * 1000))
    }
    last = now
    if (progress.value < 1) {
      frame = requestAnimationFrame(tick)
      return
    }
    running.value = false
    onDone()
  }

  const stop = () => {
    running.value = false
    cancelAnimationFrame(frame)
  }

  onMounted(() => {
    if (running.value) frame = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => cancelAnimationFrame(frame))

  return { progress, running, stop }
}

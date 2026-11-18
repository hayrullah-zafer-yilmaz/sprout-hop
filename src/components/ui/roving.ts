import { nextTick, watch, type Ref, type WatchSource } from 'vue'

export function useRovingFocus<T>(group: Ref<HTMLElement | undefined>, selected: WatchSource<T>) {
  const items = new Map<T, HTMLElement>()

  watch(selected, async (key) => {
    if (!group.value?.contains(document.activeElement)) return
    await nextTick()
    items.get(key)?.focus()
  })

  return {
    bind: (key: T) => (element: unknown) => {
      if (element instanceof HTMLElement) items.set(key, element)
      else items.delete(key)
    },
  }
}

import type { Directive } from 'vue'

export const vAutofocus: Directive<HTMLElement, boolean | undefined> = {
  mounted: (element, binding) => {
    if (binding.value !== false) element.focus({ preventScroll: true })
  },
}

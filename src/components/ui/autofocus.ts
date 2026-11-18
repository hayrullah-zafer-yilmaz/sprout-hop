import type { Directive } from 'vue'

export const vAutofocus: Directive<HTMLElement> = {
  mounted: (element) => element.focus({ preventScroll: true }),
}

import { ui } from '../../../app/store'
import type { Player } from '../../../game/entities'

export function airborne(p: Player): boolean {
  return !p.onGround && ui.screen !== 'title' && ui.screen !== 'select'
}

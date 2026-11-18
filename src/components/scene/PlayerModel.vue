<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import { Vector3, type Group } from 'three'
import type { Player } from '../../game/entities'
import { CHARACTERS } from '../../game/characters'
import { RULES } from '../../game/config'
import { ui } from '../../app/store'
import { HERO, strideOf } from '../../scene/hero'
import type { Expression } from '../../scene/heroFace'
import { armGeometry, bodyGeometry, faceGeometry, getHeroKit } from '../../scene/heroKit'
import { PRIORITY, useWorld } from '../../scene/context'
import { nodeList } from '../../scene/nodes'
import SproutGear from './heroes/SproutGear.vue'
import ZipGear from './heroes/ZipGear.vue'
import BunGear from './heroes/BunGear.vue'
import { airborne } from './heroes/pose'

const { center: CENTER } = HERO
const TURN_ANGLE = 0.7
const TURN_RATE = 12
const LANDING_TIME = 0.18
const CHEER_TIME = 0.45
const CHEER_HEIGHT = 0.4
const SHOCK_TIME = 0.35
const LEAN = { ground: 0.17, air: 0.06, rate: 10 }
const BLINK = { min: 1.8, max: 4.6, length: 0.13, double: 0.22 }
const ARM = { rest: 0.5, raise: 1.3, swing: 0.95, wave: 0.22 }
const SHOULDERS = [
  { side: -1, phase: Math.PI },
  { side: 1, phase: 0 },
]
const FEET = [
  { side: -0.17, phase: 0 },
  { side: 0.17, phase: Math.PI },
]

const world = useWorld()
const kit = computed(() => getHeroKit(ui.character))
const root = shallowRef<Group>()
const body = shallowRef<Group>()
const arms = nodeList<Group>()
const feet = nodeList<Group>()
const leanAxis = new Vector3()

const pose = { turn: 0.6, stride: 0, step: 0, spin: 0, cheer: 0, lean: 0, blinkAt: 2, blinkUntil: 0 }

watch(
  () => ui.character,
  () => {
    pose.cheer = CHEER_TIME
  },
)

function blinking(elapsed: number): boolean {
  if (elapsed >= pose.blinkAt) {
    pose.blinkUntil = elapsed + BLINK.length
    const gap = Math.random() < BLINK.double ? BLINK.length * 2.4 : BLINK.min + Math.random() * (BLINK.max - BLINK.min)
    pose.blinkAt = elapsed + gap
  }
  return elapsed < pose.blinkUntil
}

function expressionOf(p: Player, flying: boolean, elapsed: number, celebrating: boolean): Expression {
  const closed = blinking(elapsed)
  if (p.dead) return p.deadTimer > RULES.respawnDelay - SHOCK_TIME ? 'hurt' : 'ko'
  if (pose.cheer > 0) return 'wink'
  if (celebrating) return 'happy'
  if (flying) return p.gliding ? 'happy' : 'jump'
  if (closed || world.clock - p.landedAt < LANDING_TIME * 0.7) return 'blink'
  if (Math.abs(p.vx) > CHARACTERS[ui.character].moves.walkSpeed + 0.5) return 'focus'
  return 'neutral'
}

function animateFeet(flying: boolean, swingX: number, swingZ: number): void {
  FEET.forEach(({ side, phase }, index) => {
    const foot = feet.items[index]
    if (!foot) return
    if (flying) {
      const forward = phase === 0
      foot.position.set(side, 0.05, forward ? 0.1 : -0.05)
      foot.rotation.set(forward ? -0.32 : 0.36, 0, 0)
      return
    }
    const swing = Math.sin(pose.step + phase) * 0.15 * pose.stride
    const lift = Math.max(0, Math.cos(pose.step + phase)) * 0.08 * pose.stride
    foot.position.set(side + swing * swingX, lift, 0.03 + swing * swingZ)
    foot.rotation.set(-lift * 3.5, 0, 0)
  })
}

function animateArms(p: Player, flying: boolean, elapsed: number, cheering: boolean): void {
  SHOULDERS.forEach(({ side, phase }, index) => {
    const arm = arms.items[index]
    if (!arm) return
    let raise = ARM.rest + Math.sin(elapsed * 3 + phase) * 0.04
    let swing = 0
    if (cheering) raise = ARM.raise + Math.sin(elapsed * 14 + phase) * ARM.wave
    else if (flying) raise = p.gliding ? ARM.raise * 0.75 : ARM.raise
    else swing = Math.sin(pose.step + phase) * ARM.swing * pose.stride
    arm.rotation.set(swing, 0, side * raise)
  })
}

function lean(torso: Group, p: Player, flying: boolean, dt: number): void {
  const target = (flying ? LEAN.air : LEAN.ground) * pose.stride
  pose.lean += (target - pose.lean) * (1 - Math.exp(-dt * LEAN.rate))
  leanAxis.set(-Math.sin(pose.turn), 0, Math.cos(pose.turn))
  torso.quaternion.setFromAxisAngle(leanAxis, -Math.sign(p.vx || p.facing) * pose.lean)
}

function squashAndStretch(torso: Group, p: Player, flying: boolean, elapsed: number, dt: number, celebrating: boolean): void {
  let sx = 1
  let sy = 1
  const sinceLanding = world.clock - p.landedAt
  if (!flying && sinceLanding < LANDING_TIME) {
    const k = 1 - sinceLanding / LANDING_TIME
    sy = 1 - 0.28 * k
    sx = 1 + 0.18 * k
  } else if (flying) {
    const k = Math.min(Math.abs(p.vy) / 20, 1)
    sy = 1 + 0.16 * k
    sx = 1 - 0.1 * k
  } else if (Math.abs(p.vx) < 0.2) {
    const breath = Math.sin(elapsed * 3) * 0.025
    sy = 1 + breath
    sx = 1 - breath * 0.6
  }
  torso.scale.set(sx, sy, sx)
  const bob = flying ? 0 : Math.abs(Math.sin(pose.step)) * 0.06 * pose.stride
  torso.position.y = celebrating && !flying ? Math.abs(Math.sin(elapsed * 7)) * 0.3 : bob
  if (pose.cheer > 0) {
    pose.cheer = Math.max(0, pose.cheer - dt)
    torso.position.y += Math.sin((1 - pose.cheer / CHEER_TIME) * Math.PI) * CHEER_HEIGHT
  }
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta, elapsed }) => {
  const node = root.value
  const torso = body.value
  if (!node || !torso) return
  const dt = Math.min(delta, 0.1)
  const p = world.player
  const flying = airborne(p)
  const celebrating = world.phase === 'won' || world.phase === 'complete'
  kit.value.atlas.show(expressionOf(p, flying, elapsed, celebrating))

  node.position.set(p.x + p.w / 2, p.y, 0)
  node.visible = !(p.invulnerable > 0 && Math.floor(elapsed * 14) % 2 === 0)
  if (p.dead) {
    pose.spin += dt * 10
    node.rotation.set(0, pose.spin * 0.3, pose.spin)
    return
  }
  pose.spin = 0

  const facingCamera = (celebrating && !flying) || ui.screen === 'select'
  const targetTurn = facingCamera ? 0 : p.facing * TURN_ANGLE
  pose.turn += (targetTurn - pose.turn) * (1 - Math.exp(-dt * TURN_RATE))
  node.rotation.set(0, pose.turn, 0)

  const speed = Math.abs(p.vx)
  pose.stride = strideOf(p.vx)
  if (!flying && speed > 0.2) pose.step += dt * (7 + speed * 1.6)
  const swingX = Math.cos(pose.turn) * p.facing
  const swingZ = Math.sin(pose.turn) * p.facing

  animateFeet(flying, swingX, swingZ)
  animateArms(p, flying, elapsed, pose.cheer > 0 || (celebrating && !flying))
  squashAndStretch(torso, p, flying, elapsed, dt, celebrating)
  lean(torso, p, flying, dt)
}, PRIORITY.models)
</script>

<template>
  <TresGroup ref="root">
    <TresGroup ref="body">
      <TresMesh :geometry="bodyGeometry" :material="kit.body" cast-shadow>
        <TresMesh :geometry="bodyGeometry" :material="kit.outline" />
      </TresMesh>
      <TresMesh :geometry="faceGeometry" :material="kit.face" />
      <TresGroup
        v-for="(shoulder, index) in SHOULDERS"
        :key="shoulder.side"
        :ref="arms.refAt(index)"
        :position="[shoulder.side * 0.405, CENTER + 0.02, 0.03]"
      >
        <TresMesh :geometry="armGeometry" :material="kit.limbs" :position="[0, -0.078, 0]" :scale="[0.86, 1.1, 0.9]" cast-shadow>
          <TresMesh :geometry="armGeometry" :material="kit.fineOutline" />
        </TresMesh>
      </TresGroup>
      <SproutGear v-if="ui.character === 'sprout'" />
      <ZipGear v-else-if="ui.character === 'zip'" />
      <BunGear v-else />
    </TresGroup>
    <TresGroup v-for="(foot, index) in FEET" :key="foot.side" :ref="feet.refAt(index)" :position="[foot.side, 0, 0.03]">
      <TresMesh :geometry="kit.shoe" :material="kit.shoeSkin" cast-shadow>
        <TresMesh :geometry="kit.shoe" :material="kit.fineOutline" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>

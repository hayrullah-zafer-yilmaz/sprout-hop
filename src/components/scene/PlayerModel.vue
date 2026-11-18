<script setup lang="ts">
import { shallowRef, type ShallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group, Mesh } from 'three'
import type { Player } from '../../game/entities'
import { PRIORITY, useWorld } from '../../scene/context'

const RADIUS = 0.42
const CENTER = 0.5
const TURN_ANGLE = 0.7
const TURN_RATE = 12
const LANDING_TIME = 0.18
const BLINK_PERIOD = 3.4

interface Limb {
  mesh: ShallowRef<Mesh | undefined>
  phase: number
  side: number
}

const world = useWorld()
const root = shallowRef<Group>()
const body = shallowRef<Group>()
const eyes = shallowRef<Group>()
const sprout = shallowRef<Group>()
const scarfTail = shallowRef<Group>()
const leftArm = shallowRef<Mesh>()
const rightArm = shallowRef<Mesh>()
const leftFoot = shallowRef<Mesh>()
const rightFoot = shallowRef<Mesh>()

const feet: Limb[] = [
  { mesh: leftFoot, phase: 0, side: -0.17 },
  { mesh: rightFoot, phase: Math.PI, side: 0.17 },
]
const arms: Limb[] = [
  { mesh: leftArm, phase: Math.PI, side: -1 },
  { mesh: rightArm, phase: 0, side: 1 },
]

const pose = { turn: 0.6, stride: 0, step: 0, spin: 0 }

function animateFeet(p: Player, swingX: number, swingZ: number): void {
  for (const { mesh, phase, side } of feet) {
    const foot = mesh.value
    if (!foot) continue
    if (!p.onGround) {
      foot.position.set(side, 0.1, phase === 0 ? 0.1 : -0.04)
      continue
    }
    const swing = Math.sin(pose.step + phase) * 0.15 * pose.stride
    const lift = Math.max(0, Math.cos(pose.step + phase)) * 0.08 * pose.stride
    foot.position.set(side + swing * swingX, 0.06 + lift, 0.03 + swing * swingZ)
  }
}

function animateArms(p: Player, swingX: number, swingZ: number): void {
  for (const { mesh, phase, side } of arms) {
    const arm = mesh.value
    if (!arm) continue
    if (!p.onGround) {
      arm.position.set(side * 0.41, CENTER + 0.16, 0.02)
      arm.rotation.z = side * 0.9
      continue
    }
    const swing = Math.sin(pose.step + phase) * 0.1 * pose.stride
    arm.position.set(side * 0.41 + swing * swingX, CENTER - 0.06, 0.02 + swing * swingZ)
    arm.rotation.z = side * 0.25
  }
}

function squashAndStretch(torso: Group, p: Player, elapsed: number, celebrating: boolean): void {
  let sx = 1
  let sy = 1
  const sinceLanding = world.clock - p.landedAt
  if (p.onGround && sinceLanding < LANDING_TIME) {
    const k = 1 - sinceLanding / LANDING_TIME
    sy = 1 - 0.28 * k
    sx = 1 + 0.18 * k
  } else if (!p.onGround) {
    const k = Math.min(Math.abs(p.vy) / 20, 1)
    sy = 1 + 0.16 * k
    sx = 1 - 0.1 * k
  } else if (Math.abs(p.vx) < 0.2) {
    const breath = Math.sin(elapsed * 3) * 0.025
    sy = 1 + breath
    sx = 1 - breath * 0.6
  }
  torso.scale.set(sx, sy, sx)
  const bob = p.onGround ? Math.abs(Math.sin(pose.step)) * 0.06 * pose.stride : 0
  torso.position.y = celebrating && p.onGround ? Math.abs(Math.sin(elapsed * 7)) * 0.3 : bob
}

function animateDetails(p: Player, elapsed: number): void {
  if (sprout.value) sprout.value.rotation.z = Math.sin(elapsed * 4) * 0.14 - p.vx * 0.03
  if (scarfTail.value) {
    const flutter = Math.sin(elapsed * 14) * 0.15 * (0.3 + pose.stride)
    scarfTail.value.rotation.x = 0.5 + pose.stride * 0.7 + (p.onGround ? 0 : 0.4) + flutter
  }
  if (eyes.value) eyes.value.scale.y = elapsed % BLINK_PERIOD < 0.12 ? 0.12 : 1
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta, elapsed }) => {
  const node = root.value
  const torso = body.value
  if (!node || !torso) return
  const dt = Math.min(delta, 0.1)
  const p = world.player

  node.position.set(p.x + p.w / 2, p.y, 0)
  node.visible = !(p.invulnerable > 0 && Math.floor(elapsed * 14) % 2 === 0)
  if (p.dead) {
    pose.spin += dt * 10
    node.rotation.set(0, pose.spin * 0.3, pose.spin)
    return
  }
  pose.spin = 0

  const celebrating = world.phase === 'won' || world.phase === 'complete'
  const targetTurn = celebrating && p.onGround ? 0 : p.facing * TURN_ANGLE
  pose.turn += (targetTurn - pose.turn) * (1 - Math.exp(-dt * TURN_RATE))
  node.rotation.set(0, pose.turn, 0)

  const speed = Math.abs(p.vx)
  pose.stride = Math.min(speed / 6, 1)
  if (p.onGround && speed > 0.2) pose.step += dt * (7 + speed * 1.6)
  const swingX = Math.cos(pose.turn) * p.facing
  const swingZ = Math.sin(pose.turn) * p.facing

  animateFeet(p, swingX, swingZ)
  animateArms(p, swingX, swingZ)
  squashAndStretch(torso, p, elapsed, celebrating)
  animateDetails(p, elapsed)
}, PRIORITY.models)
</script>

<template>
  <TresGroup ref="root">
    <TresGroup ref="body">
      <TresMesh :position="[0, CENTER, 0]" cast-shadow>
        <TresSphereGeometry :args="[RADIUS, 40, 28]" />
        <TresMeshStandardMaterial color="#ffa046" :roughness="0.45" />
      </TresMesh>

      <TresGroup ref="eyes" :position="[0, CENTER + 0.05, 0]">
        <TresMesh v-for="x in [-0.14, 0.14]" :key="`eye${x}`" :position="[x, 0, 0.372]" :scale="[1, 1.2, 0.5]">
          <TresSphereGeometry :args="[0.1, 20, 14]" />
          <TresMeshStandardMaterial color="#ffffff" :roughness="0.25" />
        </TresMesh>
        <TresMesh v-for="x in [-0.135, 0.135]" :key="`pupil${x}`" :position="[x, -0.012, 0.418]" :scale="[1, 1.15, 0.5]">
          <TresSphereGeometry :args="[0.058, 14, 10]" />
          <TresMeshBasicMaterial color="#13233a" />
        </TresMesh>
        <TresMesh v-for="x in [-0.115, 0.155]" :key="`shine${x}`" :position="[x, 0.015, 0.448]">
          <TresSphereGeometry :args="[0.018, 8, 6]" />
          <TresMeshBasicMaterial color="#ffffff" />
        </TresMesh>
      </TresGroup>

      <TresMesh v-for="x in [-0.25, 0.25]" :key="`cheek${x}`" :position="[x, CENTER - 0.07, 0.325]" :scale="[1, 0.55, 0.35]">
        <TresSphereGeometry :args="[0.06, 12, 8]" />
        <TresMeshBasicMaterial color="#ff7f8f" />
      </TresMesh>
      <TresMesh :position="[0, CENTER - 0.085, 0.405]" :rotation="[0, 0, Math.PI]">
        <TresTorusGeometry :args="[0.045, 0.014, 6, 14, Math.PI]" />
        <TresMeshBasicMaterial color="#6b2a12" />
      </TresMesh>

      <TresMesh :position="[0, CENTER - 0.25, 0]" :rotation="[Math.PI / 2, 0, 0]" cast-shadow>
        <TresTorusGeometry :args="[0.336, 0.036, 8, 36]" />
        <TresMeshStandardMaterial color="#2f6fde" :roughness="0.55" />
      </TresMesh>
      <TresGroup ref="scarfTail" :position="[0.1, CENTER - 0.25, -0.34]">
        <TresMesh :position="[0, -0.1, 0]" :rotation="[0, 0, -0.25]">
          <TresBoxGeometry :args="[0.09, 0.2, 0.04]" />
          <TresMeshStandardMaterial color="#2f6fde" :roughness="0.55" />
        </TresMesh>
        <TresMesh :position="[0.06, -0.08, 0.01]" :rotation="[0, 0, 0.3]">
          <TresBoxGeometry :args="[0.08, 0.16, 0.04]" />
          <TresMeshStandardMaterial color="#2a62c8" :roughness="0.55" />
        </TresMesh>
      </TresGroup>

      <TresMesh ref="leftArm" :position="[-0.43, CENTER - 0.06, 0.02]" :scale="[0.8, 1, 0.8]" cast-shadow>
        <TresSphereGeometry :args="[0.1, 16, 12]" />
        <TresMeshStandardMaterial color="#f58a2c" :roughness="0.55" />
      </TresMesh>
      <TresMesh ref="rightArm" :position="[0.43, CENTER - 0.06, 0.02]" :scale="[0.8, 1, 0.8]" cast-shadow>
        <TresSphereGeometry :args="[0.1, 16, 12]" />
        <TresMeshStandardMaterial color="#f58a2c" :roughness="0.55" />
      </TresMesh>

      <TresGroup ref="sprout" :position="[0, CENTER + RADIUS - 0.03, 0]">
        <TresMesh :position="[0, 0.06, 0]">
          <TresCylinderGeometry :args="[0.018, 0.026, 0.13, 6]" />
          <TresMeshStandardMaterial color="#2f9e44" />
        </TresMesh>
        <TresMesh :position="[-0.1, 0.14, 0]" :rotation="[0, 0, 0.45]" :scale="[1.7, 0.5, 0.85]">
          <TresSphereGeometry :args="[0.085, 12, 8]" />
          <TresMeshStandardMaterial color="#51cf66" :roughness="0.5" />
        </TresMesh>
        <TresMesh :position="[0.1, 0.16, 0]" :rotation="[0, 0, -0.45]" :scale="[1.7, 0.5, 0.85]">
          <TresSphereGeometry :args="[0.085, 12, 8]" />
          <TresMeshStandardMaterial color="#51cf66" :roughness="0.5" />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <TresMesh ref="leftFoot" :position="[-0.17, 0.06, 0.03]" :scale="[1, 0.62, 1.35]" cast-shadow>
      <TresSphereGeometry :args="[0.12, 16, 12]" />
      <TresMeshStandardMaterial color="#6b3f22" :roughness="0.7" />
    </TresMesh>
    <TresMesh ref="rightFoot" :position="[0.17, 0.06, 0.03]" :scale="[1, 0.62, 1.35]" cast-shadow>
      <TresSphereGeometry :args="[0.12, 16, 12]" />
      <TresMeshStandardMaterial color="#6b3f22" :roughness="0.7" />
    </TresMesh>
  </TresGroup>
</template>

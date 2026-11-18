<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import type { DirectionalLight, PerspectiveCamera } from 'three'
import { PRIORITY, useWorld } from '../../scene/context'

const FOV = 42
const DISTANCE = 16
const MAX_DISTANCE = 40
const MIN_HALF_WIDTH = 8
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360)
const LOOK_AHEAD = 1.6
const HEIGHT = { offset: 1.4, min: 6.2, max: 9.5, tilt: 2.4 }
const FOLLOW_RATE = { x: 7, y: 3.5, lookAhead: 2 }

const world = useWorld()
const camera = shallowRef<PerspectiveCamera>()
const sun = shallowRef<DirectionalLight>()
const view = { x: 0, y: 6.5, lead: 0, ready: false }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function damp(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-dt * rate))
}

function configureShadows(light: DirectionalLight | undefined): void {
  if (!light) return
  light.shadow.mapSize.set(2048, 2048)
  Object.assign(light.shadow.camera, { left: -24, right: 24, top: 16, bottom: -12, near: 1, far: 80 })
  light.shadow.camera.updateProjectionMatrix()
  light.shadow.bias = -0.0005
  light.shadow.normalBias = 0.03
}

watch(sun, configureShadows)

function follow(dt: number): void {
  const cam = camera.value
  if (!cam) return
  const p = world.player
  const distance = clamp(MIN_HALF_WIDTH / (TAN_HALF_FOV * cam.aspect), DISTANCE, MAX_DISTANCE)
  const halfWidth = TAN_HALF_FOV * distance * cam.aspect
  const minX = halfWidth - 0.5
  const maxX = world.width - halfWidth + 0.5

  view.lead = damp(view.lead, p.dead ? view.lead : p.facing * LOOK_AHEAD, FOLLOW_RATE.lookAhead, dt)
  const targetX = maxX > minX ? clamp(p.x + p.w / 2 + view.lead, minX, maxX) : world.width / 2
  const targetY = p.dead ? view.y : clamp(p.y + HEIGHT.offset, HEIGHT.min, HEIGHT.max)
  if (!view.ready) Object.assign(view, { x: targetX, y: targetY, ready: true })
  view.x = damp(view.x, targetX, FOLLOW_RATE.x, dt)
  view.y = damp(view.y, targetY, FOLLOW_RATE.y, dt)

  cam.position.set(view.x, view.y + HEIGHT.tilt, distance)
  cam.lookAt(view.x, view.y, 0)

  const light = sun.value
  if (!light) return
  light.position.set(view.x - 10, view.y + 18, 14)
  light.target.position.set(view.x, view.y - 4, 0)
  light.target.updateMatrixWorld()
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => follow(Math.min(delta, 0.1)), PRIORITY.camera)
</script>

<template>
  <TresPerspectiveCamera ref="camera" :fov="FOV" :near="0.5" :far="600" :position="[12, 9, DISTANCE]" />
  <TresDirectionalLight ref="sun" color="#fff0d4" :intensity="2.4" cast-shadow />
</template>

import { Group, Mesh, MeshBasicMaterial, TorusGeometry } from 'three'
import { FALL_Z, buildCanyon, type CanyonStyle, type FallSpot, type Scenery } from './canyon'
import { createRippleTexture, createWaterfallTexture } from './textures'

const WATER: CanyonStyle = {
  surface: -9.8,
  sheet: { texture: createWaterfallTexture, tint: '#eaf8ff', speed: 1, shape: null, fog: true },
  mist: { color: '#ffffff', size: 3.4, opacity: 0.38, glow: false, count: 70, height: 8 },
  foam: { color: '#f6fbff', emissive: '#d8edf6', intensity: 0.3 },
  sea: { texture: createRippleTexture, scale: 10, flow: 0.05, glow: 0, opacity: 0.95, roughness: 0.18, metalness: 0.1 },
  cliffs: {
    rocks: ['#6c8288', '#5f757b', '#7a9095', '#687d83'],
    wet: ['#475b62', '#50656c', '#3f535a'],
    boulder: '#5f7a66',
    far: '#9db3bb',
    pine: '#2f6f4f',
    height: [12, 9],
    farHeight: [18, 10],
    source: 'crest',
  },
}

const RAINBOW_COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa']

function fallSpots(width: number): FallSpot[] {
  return [
    { x: width * 0.09, width: 9, top: 21 },
    { x: width * 0.47, width: 13, top: 25 },
    { x: width * 0.82, width: 8, top: 19 },
  ]
}

function createRainbow(spot: FallSpot): Group {
  const group = new Group()
  RAINBOW_COLORS.forEach((color, i) => {
    const arc = new Mesh(
      new TorusGeometry(7.4 - i * 0.28, 0.14, 6, 64, Math.PI),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false }),
    )
    group.add(arc)
  })
  group.position.set(spot.x, WATER.surface + 1, FALL_Z + 6)
  return group
}

export function buildFallsScenery(random: () => number, left: number, right: number, levelWidth: number): Scenery {
  const spots = fallSpots(levelWidth)
  const canyon = buildCanyon(random, left, right, spots, WATER)
  return { objects: [...canyon.objects, createRainbow(spots[0])], animated: canyon.animated }
}

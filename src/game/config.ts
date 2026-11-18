export const PHYSICS = {
  gravityUp: 48,
  gravityDown: 64,
  gravityCut: 130,
  maxFall: 24,
  groundDecel: 50,
  airAccel: 34,
  turnMultiplier: 1.8,
  runJumpBonus: 1.2,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  stompBounce: 12,
  stompBounceHeld: 18,
  deathBounce: 15,
  knockBounce: 9,
  enemySpeed: { slug: 2, burr: 1.5 },
  moverSpeed: 2.4,
  moverPause: 0.5,
}

export const RULES = {
  startLives: 3,
  levelTime: 300,
  coinScore: 50,
  stompScore: 100,
  brickScore: 20,
  timeBonus: 10,
  coinsPerLife: 100,
  respawnDelay: 2.2,
  invulnerableTime: 2,
  activationDistance: 18,
  tallyRate: 120,
  stompHeight: 0.45,
  playerFallLimit: -2,
  enemyFallLimit: -4,
  defeatDuration: 0.6,
  goalReach: 0.35,
  flagRaiseTime: 1.4,
}

export const EFFECTS = {
  bumpTime: 0.18,
  popCount: 6,
  coinPopSpeed: 11,
  coinPopGravity: 30,
  coinPopLife: 0.6,
  lifePopSpeed: 3,
  lifePopLife: 1.1,
  debrisCount: 32,
  debrisGravity: 40,
  debrisLife: 1.4,
  quakeDecay: 2.4,
  quakeReach: 10,
}

export const ROCKS = {
  period: 3.4,
  warning: 1,
  delay: 0.4,
  stagger: 0.5,
  groupGap: 6,
  gravity: 46,
  maxFall: 30,
  dropHeight: 16,
}

export const SIZES = {
  player: { w: 0.72, h: 0.92 },
  slug: { w: 0.86, h: 0.7 },
  burr: { w: 0.86, h: 0.8 },
  mover: { w: 3, h: 0.5 },
  rock: { w: 0.9, h: 0.9 },
  goalHeight: 9,
}

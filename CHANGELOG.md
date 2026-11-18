# Changelog

## 0.3.0 (2026-11-18)

- A second level, Misty Falls: a river canyon about 200 tiles wide with stepping stones, a wooden bridge, a lift and a moving platform over the river.
- Animated waterfalls behind the level, with rising mist, foam and a rainbow, framed by cliffs with pines and a flowing river.
- Each level has its own theme: sky, fog, light, tile and plant colors.
- A level picker on the hero screen, using `↑` `↓`, the D-pad or the mouse. After a cleared level, the result screen offers a Next level button.
- The best score is saved for each level. The existing best score carries over to Sunny Meadow.
- The bot test now finishes every level with every hero.

## 0.2.1 (2026-11-18)

- The spikes under the plank before the checkpoint are now drawn. They were invisible, so the hero seemed to die for no reason.

## 0.2.0 (2026-11-18)

- Hero selection with three heroes: Sprout is balanced, Zip runs the fastest, and Bun jumps the highest and glides while jump is held.
- A hero screen with a live 3D preview, speed and jump ratings, and keyboard, gamepad and mouse controls.
- The chosen hero is saved, shown in the HUD, and can be changed from the pause and result screens.
- The bot test now finishes the level with every hero.

## 0.1.0 (2026-11-18)

- First playable level, Sunny Meadow: about 220 tiles with pits, stairs, one-way planks, spikes, a checkpoint, two moving platforms and a goal flag.
- Platformer controls with running, variable jump height, coyote time and jump buffering. Keyboard and gamepad input.
- Coin crates, life crates, breakable bricks, slimes you can stomp and spiky rollers you have to avoid.
- HUD with score, coins, lives and a timer. Pause, game over and level complete screens. The best score is saved locally.
- English and Turkish UI.
- Textures drawn on a canvas, sound effects from the Web Audio API and procedural low-poly scenery, with no asset files.
- Vitest suite for the game rules, plus a bot that plays through the whole level.

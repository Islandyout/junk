# Echoes of the Void — Chapter One: The Hollow King

A browser-based 2D action RPG built with **Phaser 3, TypeScript and Vite**.

## Current milestone: Foundation / controls and visual direction

This first development pass intentionally concentrates on the feel of the game before expanding its five-region campaign. It establishes the playable foundation: responsive movement, jump, dodge, weapon attacks, a special ability, interaction prompts, camera follow, atmospheric environment art, and a readable combat HUD.

### Controls

| Input | Action |
| --- | --- |
| A / D or ← / → | Move |
| W / Space / ↑ | Jump |
| J / Left mouse | Basic attack |
| K | Heavy attack |
| L | Void burst |
| Shift | Dodge |
| E | Interact |
| Q | Switch weapon |
| Tab | Character/status panel |
| Esc | Pause |

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build and test

```bash
npm run build
npm run test
```

## Technical direction

- Phaser 3 + TypeScript + Vite.
- Gameplay input is separated from scene presentation.
- Movement and combat values are centralized and tunable.
- Original placeholder visuals are drawn at runtime; no unlicensed third-party art is bundled.
- The initial milestone is a focused playable slice, not the complete five-region chapter.

## Roadmap

1. Foundation: input, movement, camera, visual identity and test harness.
2. Combat slice: weapon timing, hit detection, enemy reactions and feedback.
3. Core systems: enemy AI, resources, equipment, inventory and save/load.
4. World/story: Ashen Verge, Glasswood, Sunken Cathedral, Obsidian Wastes and Eclipse Keep.
5. Boss encounters, progression, accessibility, audio and release QA.

Features are only marked complete after implementation and testing.
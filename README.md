# Grim Fight

A snappy roguelite auto-battler with drag-and-drop squad building, crunchy item crafting, and flashy abilities.

## TL;DR

Build a team, place them on a tactical grid, and hit Space to watch the chaos.

Merge components into powerful items, pick augments every few floors, and climb as far as you can on a single run.

Lightweight 2D action built with Phaser + React, shipped via Electron.

## Features

* Tactical Auto-Battles: Your squad fights automatically; you set the stage with placement, items, and synergies.
* Deep Item Crafting: Combine components into completed items (think TFT-style recipes). Drag an item onto a hero to equip; merge automatically when a valid pair is present.
* Augments & Events: Every few floors, pick from random augments that reshape your run. Enemies earn augments on milestones too.
* Abilities With Style: From Dracula’s blood hunt to Rogue’s blink-flurry and Ymir’s freezing nova, each unit has a defining kit.
* Roguelite Loop: 3 lives, escalating floors, gold rewards, occasional loot drops, and run records saved locally.
* Satisfying Juice: Damage numbers, glow/border highlights, blood bursts, lighting, and smooth tweened movement.

## How to Play

* Drag heroes from your roster/bench onto the grid.
* Equip items by dragging components onto a hero. Valid pairs auto-merge into completed items.
* Press Space to start the round.
* Win the floor to earn gold, loot, and augments at milestones. Lose all lives and your run ends (your record is saved).

(Dev only) D: toggle physics debug.

## Recipes (Quick Peek)

Components combine 2-by-2 into completed items. Examples:

* Sword + Sword → Deathblade
* Sword + Tear → Shojin
* Rod + Rod → Rabadon
* Gloves + Gloves → Thief’s Gloves (limits other slots)

In-game tooltips show possible recipes and highlight what’s craftable with your current stash.

## Roadmap (selected)

* More characters, traits, and items
* Boss floors & special events
* Balance & AI improvements
* Options (keybinds, VFX intensity, color-blind assists)

## Tech Stack

* Engine: Phaser (Arcade Physics, Lights, Graphics)
* UI: React + MUI, event-bridged with a lightweight EventBus
* Desktop: Electron via electron-vite
* Persistence: localStorage (progress, characters, run records)

## Contributing

Issues, balance notes, and PRs welcome. Please include:

* Repro steps (what you did, what you expected, what happened)
* Logs and screenshots/GIFs when relevant


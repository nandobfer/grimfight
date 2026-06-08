# Creature Visual Assets

## Features

### JSON Atlas Character Visuals
Playable characters can use either the existing fixed-grid spritesheet format or a JSON atlas visual definition. The default character registration still loads `spritesheets/characters/<name>.png` as a 64px-wide spritesheet, so existing characters do not need migration.

Atlas characters register an explicit visual definition that loads `spritesheets/characters/<name>.png` plus `spritesheets/characters/<name>.json`. The atlas JSON must expose `frames`, optional `meta.framerate`, and an `animations` object whose keys follow `<action>_<direction>`, such as `idle_down`, `walking_left`, `attacking_right`, `attacking1_up`, `attacking2_down`, or `casting_left`.

The atlas animation metadata is converted to the same Phaser animation keys used by the combat code: `<character>-<action>-<direction>`. This keeps movement, idle, attack, drag ghosts, and ability code compatible with both asset formats.

# Creature Visual Assets

## Features

### JSON Atlas Character Visuals
Playable characters can use either the existing fixed-grid spritesheet format or a JSON atlas visual definition. The default character registration still loads `spritesheets/characters/<name>.png` as a 64px-wide spritesheet, so existing characters do not need migration.

Atlas characters register an explicit visual definition that loads `spritesheets/characters/<name>.png` plus `spritesheets/characters/<name>.json`. The atlas JSON must expose `frames`, optional `meta.framerate`, and an `animations` object whose keys follow `<action>_<direction>`, such as `idle_down`, `walking_left`, `attacking_right`, `attacking1_up`, `attacking2_down`, or `casting_left`.

The atlas animation metadata is converted to the same Phaser animation keys used by the combat code: `<character>-<action>-<direction>`. This keeps movement, idle, attack, drag ghosts, and ability code compatible with both asset formats.

### SVG Spritesheet Character Visuals
Playable characters can also register an explicit SVG spritesheet visual definition for the geometric creature format documented in `docs/svg-spritesheets.md`. These assets live under `spritesheets/characters/<name>.svg` and are loaded as fixed-size Phaser spritesheets, not as named atlases.

The SVG adapter keeps the document layout rules centralized in the visual layer. It extracts `idle`, `walking`, `attacking1`, `attacking2`, and `casting` in the documented direction order and converts them to the same Phaser animation keys used by combat: `<character>-<action>-<direction>`.

The SVG adapter also sets per-action attack impact frames for the standard attack variants. This lets `attacking1` and `attacking2` land on different visual beats while preserving the existing single-frame fallback for PNG spritesheets and custom class overrides.

Characters using the standard SVG adapter should use the base attack animation selection unless they intentionally need a custom alias. If a class returns an attack action such as `attacking`, that alias must be created explicitly by its visual definition.

### Monster Visuals
Monsters share the same `CreatureVisualRegistry` used by playable characters because `Monster` extends `Creature`. `MonsterRegistry.register` installs a default PNG visual under `spritesheets/monsters/<name>.png`, and callers can pass an explicit visual definition to opt into another format.

SVG monster assets use `SvgSpritesheetCreatureVisualDefinition.monster(name)`, which loads `spritesheets/monsters/<name>.svg` using the same geometric creature contract from `docs/svg-spritesheets.md`. The monster SVG helper also creates an `attacking` alias from the standard first attack animation so existing monster classes that request `getAttackingAnimation() === "attacking"` can use SVG assets without needing a separate monster visual registry.

### SVG Effect And Projectile Visuals
FX and projectile SVG spritesheets use a separate visual registry from creatures because their animation layout is linear rather than directional. `EffectVisualRegistry` owns preload for registered effect assets, and `SvgSpritesheetEffectVisualDefinition` centralizes the `docs/svg-fx.md` contract.

Registered FX sprites are picked up by `FxSprite.initAnimation()` through the sprite texture key. Registered projectile sprites can be played by `Projectile` through its optional visual settings, while existing PNG and image-sequence particles continue to use their legacy manual animation paths.

# UI Asset Preview

## Features

### Preview Route
The React app exposes a development-oriented `/preview` route for visual inspection of local public assets without starting the main game scene. The route accepts an optional selected asset in the canonical compact form `/preview/<type>-<name>`, where `type` is `creature`, `portrait`, or `fx`. It also accepts `/preview/<type>/<name>` when loading directly so older links and ad hoc examples can still initialize the same selection.

The preview page owns its URL state through browser history. Selecting an item in the sidebar updates the path to the compact route, and browser back/forward rehydrates the selected asset from the URL.

### Asset Manifest
Previewable assets are discovered at Vite dev/build time by a virtual manifest module. The manifest scans public creature SVG spritesheets, portrait images, and FX SVG spritesheets, then exposes their public asset paths to the React preview UI. This keeps the preview list aligned with files under `public/assets` without moving visual assets into `src` or hardcoding filenames in React components.

### Rendering Contract
Creature SVG spritesheets are rendered in an isolated Phaser instance created only for the preview page. The preview loads the selected SVG as a fixed-frame spritesheet and displays every standard creature action/direction animation simultaneously in a labeled grid.

Portrait previews render as a static image because portraits are already final still assets.

FX SVG spritesheets are rendered in the same isolated Phaser preview path as a single looping animation, following the linear FX spritesheet contract.

The preview Phaser game is destroyed when the selected animated asset changes or when the React component unmounts, so it does not share state, scenes, listeners, timers, or textures with the main Grim Fight runtime.

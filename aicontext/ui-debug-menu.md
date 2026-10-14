# UI Debug Menu

## Features

### Version Display
The debug menu surfaces the application version so a running build can be identified during playtesting. The value comes from the version field declared in the package manifest and is embedded into the bundle for both development and production builds.

The label shown in the interface is derived from that manifest field through a small pure helper shared with the menu component, so the displayed number always tracks the current package version instead of a copy kept inside the interface code. This version identifies the shipped front end and is unrelated to the saved-run version field persisted with local progress.

The version line is informational only. It adds no state, events, or persistence to the menu and stays inside the existing debug panel with the other development controls.

### Debug Controls
The menu keeps its existing development controls for resetting the run, resetting the round, and adjusting speed, floor, gold, characters, and items. Opening and closing the panel through the icon button and click-away behavior is unchanged.

export const creaturePreviewDirections = ["up", "left", "down", "right"] as const

export const creaturePreviewAnimations = [
    { key: "idle", startingFrame: 0, usedFramesPerRow: 2 },
    { key: "walking", startingFrame: 36, usedFramesPerRow: 9 },
    { key: "attacking1", startingFrame: 72, usedFramesPerRow: 8 },
    { key: "attacking2", startingFrame: 108, usedFramesPerRow: 6 },
    { key: "casting", startingFrame: 144, usedFramesPerRow: 7 },
] as const

export const creaturePreviewTotalFramesPerRow = 9
export const fxPreviewFrameCount = 10

import type { Direction } from "../Creature"

export type CreatureAnimationAction = "idle" | "walking" | "attacking" | "attacking1" | "attacking2" | "casting"

export type CreatureJsonAtlasAnimationName = `${CreatureAnimationAction}_${Direction}`

export interface JsonAtlasFrameRect {
    x: number
    y: number
    w: number
    h: number
}

export interface JsonAtlasFrameData {
    frame: JsonAtlasFrameRect
    sourceSize?: { w: number; h: number }
    spriteSourceSize?: JsonAtlasFrameRect
    trimmed?: boolean
    rotated?: boolean
}

export interface JsonAtlasData {
    frames: Record<string, JsonAtlasFrameData>
    animations?: Partial<Record<CreatureJsonAtlasAnimationName, string[]>>
    meta?: {
        framerate?: number
        size?: { w: number; h: number }
    }
}

export interface ParsedJsonAtlasAnimationName {
    action: CreatureAnimationAction
    direction: Direction
}

const directions: readonly Direction[] = ["left", "up", "down", "right"]
const actions: readonly CreatureAnimationAction[] = ["idle", "walking", "attacking", "attacking1", "attacking2", "casting"]

export function isDirection(value: string): value is Direction {
    return directions.includes(value as Direction)
}

export function isCreatureAnimationAction(value: string): value is CreatureAnimationAction {
    return actions.includes(value as CreatureAnimationAction)
}

export function parseJsonAtlasAnimationName(name: string): ParsedJsonAtlasAnimationName {
    const parts = name.split("_")
    const direction = parts.pop()
    const action = parts.join("_")

    if (!direction || !isDirection(direction)) {
        throw new Error(`Invalid atlas animation direction for "${name}"`)
    }

    if (!isCreatureAnimationAction(action)) {
        throw new Error(`Invalid atlas animation action for "${name}"`)
    }

    return { action, direction }
}

export function getJsonAtlasFrameRate(data: JsonAtlasData, fallbackFrameRate: number): number {
    return data.meta?.framerate && data.meta.framerate > 0 ? data.meta.framerate : fallbackFrameRate
}

export function assertJsonAtlasAnimationFrames(data: JsonAtlasData, animationName: string, frames: readonly string[]): void {
    for (const frame of frames) {
        if (!data.frames[frame]) {
            throw new Error(`Atlas animation "${animationName}" references missing frame "${frame}"`)
        }
    }
}

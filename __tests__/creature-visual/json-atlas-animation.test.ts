import { describe, expect, it } from "vitest"
import {
    assertJsonAtlasAnimationFrames,
    getJsonAtlasFrameRate,
    JsonAtlasData,
    parseJsonAtlasAnimationName,
} from "../../src/game/creature/visual/JsonAtlasAnimation"

const atlasData: JsonAtlasData = {
    frames: {
        idle_down_0: { frame: { x: 0, y: 0, w: 128, h: 128 } },
        idle_down_1: { frame: { x: 128, y: 0, w: 128, h: 128 } },
    },
    animations: {
        idle_down: ["idle_down_0", "idle_down_1"],
    },
    meta: {
        framerate: 12,
        size: { w: 256, h: 128 },
    },
}

describe("JSON atlas animation metadata", () => {
    it("parses creature animation names into action and direction", () => {
        expect(parseJsonAtlasAnimationName("idle_down")).toEqual({ action: "idle", direction: "down" })
        expect(parseJsonAtlasAnimationName("attacking1_left")).toEqual({ action: "attacking1", direction: "left" })
    })

    it("rejects unsupported animation names", () => {
        expect(() => parseJsonAtlasAnimationName("jump_down")).toThrow(/Invalid atlas animation action/)
        expect(() => parseJsonAtlasAnimationName("idle_diagonal")).toThrow(/Invalid atlas animation direction/)
    })

    it("uses atlas framerate when provided and falls back otherwise", () => {
        expect(getJsonAtlasFrameRate(atlasData, 8)).toBe(12)
        expect(getJsonAtlasFrameRate({ ...atlasData, meta: undefined }, 8)).toBe(8)
        expect(getJsonAtlasFrameRate({ ...atlasData, meta: { framerate: 0 } }, 8)).toBe(8)
    })

    it("validates that animation frame references exist", () => {
        expect(() => assertJsonAtlasAnimationFrames(atlasData, "idle_down", ["idle_down_0"])).not.toThrow()
        expect(() => assertJsonAtlasAnimationFrames(atlasData, "idle_down", ["missing"])).toThrow(
            /references missing frame "missing"/
        )
    })
})

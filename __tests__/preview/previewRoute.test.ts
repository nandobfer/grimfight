import { describe, expect, it } from "vitest"
import { buildPreviewRoute, isPreviewRoute, parsePreviewRoute } from "../../src/preview/previewRoute"

describe("preview route helpers", () => {
    it("detects preview routes", () => {
        expect(isPreviewRoute("/preview")).toBe(true)
        expect(isPreviewRoute("/preview/creature-rokmora")).toBe(true)
        expect(isPreviewRoute("/")).toBe(false)
        expect(isPreviewRoute("/game/preview")).toBe(false)
    })

    it("parses compact type-name routes", () => {
        expect(parsePreviewRoute("/preview/creature-rokmora")).toEqual({ type: "creature", name: "rokmora" })
        expect(parsePreviewRoute("/preview/fx-flame_cleave")).toEqual({ type: "fx", name: "flame_cleave" })
    })

    it("parses slash-separated type/name routes", () => {
        expect(parsePreviewRoute("/preview/portrait/yue")).toEqual({ type: "portrait", name: "yue" })
    })

    it("ignores invalid asset types", () => {
        expect(parsePreviewRoute("/preview/item-sword")).toBeUndefined()
        expect(parsePreviewRoute("/preview/creature-")).toBeUndefined()
        expect(parsePreviewRoute("/preview")).toBeUndefined()
    })

    it("builds canonical compact routes", () => {
        expect(buildPreviewRoute({ type: "portrait", name: "yue" })).toBe("/preview/portrait-yue")
        expect(buildPreviewRoute({ type: "fx", name: "flame_cleave" })).toBe("/preview/fx-flame_cleave")
    })
})

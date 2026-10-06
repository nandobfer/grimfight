import { describe, expect, it, vi } from "vitest"
import type { GameRecord } from "../../src/game/systems/GameRecord"

vi.mock("../../src/game/systems/Traits/TraitsRegistry", () => ({
    TraitsRegistry: {
        entries: () => [{ name: "TestTrait", entry: { comp: ["first", "second"], ctor: class {
            activeComp = new Set<string>()
            activeStage = 0
            getActiveStage() { this.activeStage = this.activeComp.size >= 2 ? 2 : 0 }
        } } }],
    },
}))

import { GameRecordTraits } from "../../src/game/systems/GameRecordTraits"

describe("historical trait resolution", () => {
    it("captures only active traits from unique characters without applying combat effects", () => {
        expect(GameRecordTraits.fromComposition(["first", "first"])).toEqual([])
        expect(GameRecordTraits.fromComposition(["first", "second"])).toEqual([{ name: "TestTrait", stage: 2 }])
    })

    it("preserves recorded names and stages even when the current registry cannot reproduce them", () => {
        const record = { comp: [{ name: "first" }, { name: "second" }], traits: [{ name: "RemovedTrait", stage: 7 }] } as GameRecord
        expect(GameRecordTraits.resolve(record)).toEqual(record.traits)
        expect(GameRecordTraits.resolve({ ...record, traits: [] })).toEqual([])
        expect(GameRecordTraits.resolve({ ...record, traits: undefined })).toEqual([{ name: "TestTrait", stage: 2 }])
    })
})

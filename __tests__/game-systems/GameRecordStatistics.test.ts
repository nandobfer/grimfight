import { describe, expect, it, vi } from "vitest"
import { GameRecordStatistics, normalizeGameRecords } from "../../src/game/systems/GameRecordStatistics"

const record = (floor: number, finishedAt = new Date(2026, 0, 10, 12).getTime(), names = ["clover"]) => ({
    floor, finishedAt, comp: names.map((name, index) => ({ name, id: String(index) })), augments: [],
})

describe("GameRecordStatistics", () => {
    it("counts every run including lower and equal floors independently of input order", () => {
        const runs = [record(30), record(20), record(40), record(40)]
        for (const input of [runs, [...runs].reverse()]) {
            const statistics = new GameRecordStatistics(input, () => [{ name: "Attacker", stage: 2 }])
            expect(statistics.records).toHaveLength(4)
            expect(statistics.days[0]).toMatchObject({ count: 4, floor: 40 })
            expect(statistics.characters[0]).toMatchObject({ name: "clover", count: 4, floor: 40 })
            expect(statistics.traits[0]).toMatchObject({ name: "Attacker", count: 4, floor: 40 })
            expect(statistics.averageFloor).toBe(32.5)
            expect(statistics.bestFloor).toBe(40)
        }
    })

    it("sorts days chronologically, groups local calendar days and leaves gaps without fake zero results", () => {
        const early = new Date(2026, 0, 1, 8).getTime()
        const sameDay = new Date(2026, 0, 1, 23, 59).getTime()
        const later = new Date(2026, 1, 1, 8).getTime()
        const statistics = new GameRecordStatistics([record(80, early), record(10, later), record(20, sameDay)])
        expect(statistics.days).toEqual([
            { timestamp: new Date(2026, 0, 1).getTime(), floor: 80, count: 2 },
            { timestamp: new Date(2026, 1, 1).getTime(), floor: 10, count: 1 },
        ])
        expect(statistics.records.map((run) => run.finishedAt)).toEqual([later, sameDay, early])
    })

    it("counts each character and trait once per run", () => {
        const resolver = vi.fn(() => [{ name: "Attacker", stage: 2 }, { name: "Attacker", stage: 2 }])
        const statistics = new GameRecordStatistics([record(20, undefined, ["clover", "clover"])], resolver)
        expect(statistics.characters[0].count).toBe(1)
        expect(statistics.traits[0].count).toBe(1)
        expect(resolver).toHaveBeenCalledWith(["clover"])
    })

    it("uses stored snapshots including empty snapshots and estimates only legacy traits", () => {
        const resolver = vi.fn(() => [{ name: "Current", stage: 2 }])
        const statistics = new GameRecordStatistics([
            { ...record(50), traits: [{ name: "Historical", stage: 3 }] },
            { ...record(30), traits: [] },
            record(10),
        ], resolver)
        expect(resolver).toHaveBeenCalledTimes(1)
        expect(statistics.traits).toEqual(expect.arrayContaining([
            { name: "Historical", floor: 50, count: 1 },
            { name: "Current", floor: 10, count: 1 },
        ]))
        expect(statistics.estimatedTraits).toBe(true)
        expect(new GameRecordStatistics([{ ...record(30), traits: [] }], resolver).estimatedTraits).toBe(false)
    })

    it("orders rankings by the selected metric with stable ties without mutating input", () => {
        const entries = [{ name: "B", floor: 30, count: 1 }, { name: "C", floor: 10, count: 3 }, { name: "A", floor: 30, count: 1 }]
        expect(GameRecordStatistics.rank(entries, "floor").map((entry) => entry.name)).toEqual(["A", "B", "C"])
        expect(GameRecordStatistics.rank(entries, "count").map((entry) => entry.name)).toEqual(["C", "A", "B"])
        expect(entries[0].name).toBe("B")
    })

    it("shares only valid finished runs across all views and safely normalizes legacy character fields", () => {
        const input = [null, {}, record(10, 0), record(1.5), record(-1), record(10, Number.NaN), record(10, Number.POSITIVE_INFINITY), { ...record(10), comp: null }, record(25)]
        const statistics = new GameRecordStatistics(input)
        expect(statistics.records).toHaveLength(1)
        expect(statistics.bestFloor).toBe(25)
        expect(statistics.records[0].comp[0]).toMatchObject({ level: 1, items: [], abilityDescription: "" })
        expect(normalizeGameRecords({ records: input })).toEqual([])
        expect(new GameRecordStatistics([]).averageFloor).toBe(0)
        expect(new GameRecordStatistics([]).bestFloor).toBe(0)
    })
})

import { describe, expect, it } from "vitest"
import {
    orderRodolfoChainTargets,
    rodolfoChainDamage,
    rodolfoOutcomeChance,
    rodolfoOutcomeDamage,
    RODOLFO_CHAIN_TARGETS,
    RODOLFO_OUTCOME_AP_RATIO,
    RODOLFO_OUTCOME_NAME,
    RODOLFO_OUTCOMES,
    resolveRodolfoOutcome,
    type RodolfoOutcome,
} from "../../src/game/creature/classes/RodolfoDestiny"
import type { Character } from "../../src/game/creature/character/Character"
import { DestinyTrait } from "../../src/game/systems/Traits/DestinyTrait"
import { maxOfRolls } from "../../src/game/tools/Destiny"

describe("Rodolfo fate bands", () => {
    it("maps each roll band to its spell", () => {
        expect(resolveRodolfoOutcome(1)).toBe("water")
        expect(resolveRodolfoOutcome(59)).toBe("water")
        expect(resolveRodolfoOutcome(60)).toBe("drill")
        expect(resolveRodolfoOutcome(89)).toBe("drill")
        expect(resolveRodolfoOutcome(90)).toBe("chain")
        expect(resolveRodolfoOutcome(99)).toBe("chain")
        expect(resolveRodolfoOutcome(100)).toBe("nuke")
    })

    it("keeps the bands ordered from common to rare", () => {
        expect(resolveRodolfoOutcome(0)).toBe("water")
        expect(resolveRodolfoOutcome(101)).toBe("nuke")
    })

    it("gives every spell a distinct player-facing name", () => {
        const names = RODOLFO_OUTCOMES.map((outcome) => RODOLFO_OUTCOME_NAME[outcome])

        expect(new Set(names).size).toBe(names.length)
        expect(names).not.toContain("Fate Sorcery")
    })
})

describe("Rodolfo outcome probabilities", () => {
    it.each([1, 2, 3, 4])("sums to a full chance with %i rolls", (rolls) => {
        const total = RODOLFO_OUTCOMES.reduce((sum, outcome) => sum + rodolfoOutcomeChance(outcome, rolls), 0)

        expect(total).toBeCloseTo(1, 6)
    })

    it("makes rare spells more likely as rolls increase", () => {
        const rarer: RodolfoOutcome[] = ["drill", "chain", "nuke"]

        for (const outcome of rarer) {
            expect(rodolfoOutcomeChance(outcome, 3)).toBeGreaterThan(rodolfoOutcomeChance(outcome, 1))
        }
    })

    it("never reports a negative or above-full chance", () => {
        for (const outcome of RODOLFO_OUTCOMES) {
            for (let rolls = 1; rolls <= 4; rolls++) {
                const chance = rodolfoOutcomeChance(outcome, rolls)
                expect(chance).toBeGreaterThanOrEqual(0)
                expect(chance).toBeLessThanOrEqual(1)
            }
        }
    })
})

describe("Rodolfo outcome damage", () => {
    it.each(RODOLFO_OUTCOMES)("scales %s linearly with AP and multiplier", (outcome) => {
        const base = rodolfoOutcomeDamage(50, outcome)

        expect(Number.isFinite(base)).toBe(true)
        expect(base).toBeGreaterThan(0)
        expect(base).toBeCloseTo(50 * RODOLFO_OUTCOME_AP_RATIO[outcome])
        expect(rodolfoOutcomeDamage(50, outcome, 2)).toBeCloseTo(base * 2)
        expect(rodolfoOutcomeDamage(100, outcome)).toBeCloseTo(base * 2)
    })

    it("decays each chain jump from the previous hit", () => {
        const base = rodolfoOutcomeDamage(50, "chain")

        expect(rodolfoChainDamage(base, 0)).toBeCloseTo(base)
        expect(rodolfoChainDamage(base, 1)).toBeLessThan(rodolfoChainDamage(base, 0))
        expect(rodolfoChainDamage(base, 2)).toBeLessThan(rodolfoChainDamage(base, 1))
    })
})

describe("Rodolfo chain targeting", () => {
    it("links the nearest next target without repeating", () => {
        const candidates = [
            { target: "a", x: 10, y: 0 },
            { target: "b", x: 100, y: 0 },
            { target: "c", x: 20, y: 0 },
            { target: "d", x: 30, y: 0 },
        ]

        const ordered = orderRodolfoChainTargets({ x: 0, y: 0 }, candidates, 3)

        expect(ordered).toEqual(["a", "c", "d"])
        expect(new Set(ordered).size).toBe(ordered.length)
    })

    it("never exceeds the chain target limit", () => {
        const candidates = Array.from({ length: 10 }, (_, index) => ({ target: index, x: index, y: 0 }))
        const ordered = orderRodolfoChainTargets({ x: 0, y: 0 }, candidates, RODOLFO_CHAIN_TARGETS)

        expect(ordered.length).toBe(RODOLFO_CHAIN_TARGETS)
    })

    it("returns everything when fewer targets than the limit exist", () => {
        const candidates = [
            { target: "a", x: 5, y: 0 },
            { target: "b", x: 15, y: 0 },
        ]

        expect(orderRodolfoChainTargets({ x: 0, y: 0 }, candidates, RODOLFO_CHAIN_TARGETS)).toEqual(["a", "b"])
    })
})

describe("Destiny advantage", () => {
    it("keeps the highest of the rolled values", () => {
        const values = [7, 42, 13]
        let index = 0

        expect(maxOfRolls(3, () => values[index++])).toBe(42)
    })

    it("treats a single roll as no advantage", () => {
        expect(maxOfRolls(1, () => 5)).toBe(5)
    })

    it("rolls at least once for invalid counts", () => {
        expect(maxOfRolls(0, () => 9)).toBe(9)
    })

    it("never decreases as rolls increase", () => {
        let calls = 0
        const roll = () => {
            calls++
            return calls === 1 ? 20 : 30
        }

        expect(maxOfRolls(2, roll)).toBe(30)
    })
})

describe("Destiny trait stages", () => {
    const trait = () => new DestinyTrait(["rodolfo"])

    it("starts counting from two units and scales the roll count", () => {
        expect([...trait().stages.keys()]).toEqual([2, 3, 4])
        expect(trait().stages.get(2)?.rolls).toBe(2)
        expect(trait().stages.get(3)?.rolls).toBe(3)
        expect(trait().stages.get(4)?.rolls).toBe(4)
    })

    it("stays inactive with a single Destiny unit", () => {
        const destiny = trait()
        destiny.startApplying([{ name: "rodolfo" } as unknown as Character])

        expect(destiny.activeStage).toBe(0)
    })

    it("activates the second stage with two Destiny units", () => {
        const destiny = new DestinyTrait(["rodolfo", "alice"])
        destiny.startApplying([{ name: "rodolfo" } as unknown as Character, { name: "alice" } as unknown as Character])

        expect(destiny.activeStage).toBe(2)
    })

    it("describes the roll count without duplicating wording", () => {
        const destiny = trait()

        expect(destiny.description).toContain("{0}")
        expect(destiny.description.toLowerCase()).not.toContain("duplica")
        expect(destiny.description.toLowerCase()).not.toContain("triplica")
        expect(destiny.description.toLowerCase()).not.toContain("quadruplica")
    })
})

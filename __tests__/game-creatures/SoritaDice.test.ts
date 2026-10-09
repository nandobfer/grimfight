import { describe, expect, it } from "vitest"
import {
    isSoritaDropTarget,
    resolveSoritaDrop,
    soritaDicePips,
    soritaRollDamage,
    soritaRollsCrit,
    soritaStrikeDamageType,
    SORITA_BASE_DAMAGE_AD_RATIO,
    SORITA_CRIT_FACE,
    SORITA_DIE_FACES,
    SORITA_DROP_ROLLS,
    SORITA_ROLL_DAMAGE_AD_RATIO,
    type SoritaDrop,
} from "../../src/game/creature/classes/SoritaDice"
import { maxOfRolls } from "../../src/game/tools/Destiny"

describe("Sorita loaded die", () => {
    it("uses a six-sided die whose top face guarantees a critical", () => {
        expect(SORITA_DIE_FACES).toBe(6)
        expect(SORITA_CRIT_FACE).toBe(SORITA_DIE_FACES)
    })

    it("only guarantees a crit on the critical face and above", () => {
        for (let roll = 1; roll < SORITA_CRIT_FACE; roll++) {
            expect(soritaRollsCrit(roll)).toBe(false)
        }
        expect(soritaRollsCrit(SORITA_CRIT_FACE)).toBe(true)
    })
})

describe("Sorita loaded strike damage", () => {
    it("deals base AD plus one step per pip", () => {
        const step = 100 * SORITA_ROLL_DAMAGE_AD_RATIO
        const base = 100 * SORITA_BASE_DAMAGE_AD_RATIO

        expect(soritaRollDamage(100, 1)).toBeCloseTo(base + step)
        expect(soritaRollDamage(100, 3)).toBeCloseTo(base + step * 3)
        expect(soritaRollDamage(100, SORITA_DIE_FACES)).toBeCloseTo(base + step * SORITA_DIE_FACES)
    })

    it("scales with AD and stays finite", () => {
        const base = soritaRollDamage(100, 4)

        expect(Number.isFinite(base)).toBe(true)
        expect(soritaRollDamage(200, 4)).toBeCloseTo(base * 2)
        expect(soritaRollDamage(0, SORITA_DIE_FACES)).toBe(0)
    })

    it("grows with the roll so higher faces hit harder", () => {
        let previous = -Infinity

        for (let roll = 1; roll <= SORITA_DIE_FACES; roll++) {
            const damage = soritaRollDamage(80, roll)
            expect(damage).toBeGreaterThan(previous)
            previous = damage
        }
    })

    it("always hits at least as hard as a plain basic attack", () => {
        for (let roll = 1; roll <= SORITA_DIE_FACES; roll++) {
            expect(soritaRollDamage(80, roll)).toBeGreaterThanOrEqual(80)
        }
    })
})

describe("Sorita death drop table", () => {
    it("drops an artifact only on a perfect roll", () => {
        expect(resolveSoritaDrop(100)).toBe("artifact")
        expect(resolveSoritaDrop(99)).toBeNull()
        expect(resolveSoritaDrop(90)).toBe("completed")
    })

    it("drops a completed item only on the listed high rolls", () => {
        for (const roll of [70, 80, 90]) {
            expect(resolveSoritaDrop(roll)).toBe("completed")
        }
        expect(resolveSoritaDrop(60)).toBe("component")
        expect(resolveSoritaDrop(71)).toBeNull()
    })

    it("drops a component only on the listed low rolls", () => {
        for (const roll of [10, 20, 30, 40, 50, 60]) {
            expect(resolveSoritaDrop(roll)).toBe("component")
        }
        expect(resolveSoritaDrop(9)).toBeNull()
        expect(resolveSoritaDrop(11)).toBeNull()
        expect(resolveSoritaDrop(0)).toBeNull()
    })

    it("drops nothing on every other roll", () => {
        const dropping = new Set<number>([
            ...SORITA_DROP_ROLLS.artifact,
            ...SORITA_DROP_ROLLS.completed,
            ...SORITA_DROP_ROLLS.component,
        ])

        for (let roll = 1; roll <= 100; roll++) {
            if (dropping.has(roll)) {
                expect(resolveSoritaDrop(roll)).not.toBeNull()
            } else {
                expect(resolveSoritaDrop(roll)).toBeNull()
            }
        }
    })

    it("maps every listed roll to the expected tier", () => {
        const expectations: Array<[number, SoritaDrop | null]> = [
            [100, "artifact"],
            [99, null],
            [90, "completed"],
            [80, "completed"],
            [70, "completed"],
            [60, "component"],
            [10, "component"],
            [0, null],
        ]

        for (const [roll, tier] of expectations) {
            expect(resolveSoritaDrop(roll)).toBe(tier)
        }
    })
})

describe("Sorita and the Destiny trait", () => {
    it("keeps the best of several rolls, raising the odds of a top face", () => {
        const values = [2, 6, 4]
        let index = 0

        expect(maxOfRolls(3, () => values[index++])).toBe(SORITA_CRIT_FACE)
    })
})

describe("Sorita strike damage type", () => {
    it("deals physical damage on normal faces", () => {
        for (let roll = 1; roll < SORITA_CRIT_FACE; roll++) {
            expect(soritaStrikeDamageType(roll)).toBe("normal")
        }
    })

    it("deals true damage on the critical face", () => {
        expect(soritaStrikeDamageType(SORITA_CRIT_FACE)).toBe("true")
    })

    it("turns true damage on exactly the rolls that guarantee a crit", () => {
        for (let roll = 1; roll <= SORITA_DIE_FACES; roll++) {
            expect(soritaStrikeDamageType(roll) === "true").toBe(soritaRollsCrit(roll))
        }
    })
})

describe("Sorita death drop targets", () => {
    it("accepts plain encounter creatures", () => {
        expect(isSoritaDropTarget({})).toBe(true)
        expect(isSoritaDropTarget({ isClone: false })).toBe(true)
    })

    it("ignores summons and temporary clones", () => {
        expect(isSoritaDropTarget({ master: {} })).toBe(false)
        expect(isSoritaDropTarget({ isClone: true })).toBe(false)
        expect(isSoritaDropTarget({ master: {}, isClone: true })).toBe(false)
    })
})

describe("Sorita die pip layout", () => {
    it("returns one pip per face value", () => {
        for (let face = 1; face <= SORITA_DIE_FACES; face++) {
            expect(soritaDicePips(face)).toHaveLength(face)
        }
    })

    it("keeps every pip inside the unit square", () => {
        for (let face = 1; face <= SORITA_DIE_FACES; face++) {
            for (const pip of soritaDicePips(face)) {
                expect(pip.x).toBeGreaterThanOrEqual(-1)
                expect(pip.x).toBeLessThanOrEqual(1)
                expect(pip.y).toBeGreaterThanOrEqual(-1)
                expect(pip.y).toBeLessThanOrEqual(1)
            }
        }
    })

    it("lays the critical face as two columns of three pips", () => {
        const pips = soritaDicePips(SORITA_CRIT_FACE)
        const columns = new Set(pips.map((pip) => Math.sign(pip.x)))

        expect(pips).toHaveLength(6)
        expect(columns.size).toBe(2)
        expect(columns.has(0)).toBe(false)
    })

    it("returns no pips for an unknown face", () => {
        expect(soritaDicePips(0)).toEqual([])
        expect(soritaDicePips(7)).toEqual([])
    })
})

import { describe, expect, it } from "vitest"
import {
    calculateRobiltonBlackHolePullStrength,
    calculateRobiltonBlackHoleRadius,
    calculateRobiltonCastDuration,
    calculateRobiltonExplosionDamage,
    calculateRobiltonExplosionRadius,
    calculateRobiltonGravityOrbDamage,
    calculateRobiltonStarRadius,
    ROBILTON_BASE_CAST_MS,
    ROBILTON_MAX_CAST_MS,
    ROBILTON_MIN_CAST_MS,
} from "../../src/game/creature/classes/RobiltonNeutronStar"

describe("Robilton neutron star formulas", () => {
    it("shortens cast duration as attack speed increases", () => {
        expect(calculateRobiltonCastDuration(1)).toBe(ROBILTON_BASE_CAST_MS)
        expect(calculateRobiltonCastDuration(2)).toBeLessThan(calculateRobiltonCastDuration(1))
    })

    it("keeps cast duration within safe bounds", () => {
        expect(calculateRobiltonCastDuration(0)).toBe(ROBILTON_MAX_CAST_MS)
        expect(calculateRobiltonCastDuration(999)).toBe(ROBILTON_MIN_CAST_MS)
    })

    it("scales neutron star outputs with ability power", () => {
        const lowAp = 50
        const highAp = 100

        expect(calculateRobiltonStarRadius(highAp)).toBeGreaterThan(calculateRobiltonStarRadius(lowAp))
        expect(calculateRobiltonExplosionDamage(highAp)).toBeGreaterThan(calculateRobiltonExplosionDamage(lowAp))
        expect(calculateRobiltonExplosionRadius(highAp)).toBeGreaterThan(calculateRobiltonExplosionRadius(lowAp))
        expect(calculateRobiltonBlackHoleRadius(highAp)).toBeGreaterThan(calculateRobiltonBlackHoleRadius(lowAp))
        expect(calculateRobiltonBlackHolePullStrength(highAp)).toBeGreaterThan(calculateRobiltonBlackHolePullStrength(lowAp))
    })

    it("scales gravity orb damage with stack count and ability power", () => {
        const oneStack = calculateRobiltonGravityOrbDamage(50, 1)

        expect(calculateRobiltonGravityOrbDamage(50, 3)).toBeCloseTo(oneStack * 3)
        expect(calculateRobiltonGravityOrbDamage(100, 1)).toBeGreaterThan(oneStack)
        expect(calculateRobiltonGravityOrbDamage(100, 0)).toBe(0)
    })
})

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const statusDir = join(root, "src/game/objects/StatusEffect")

const contextPath = join(root, "aicontext/game-status-effects.md")

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

describe("Status Effect aicontext", () => {
    it("documents status effect contracts without numeric balance values", () => {
        const context = readSource(contextPath)

        for (const heading of ["### Lifecycle And Cleanup", "### Condition", "### Dot And Hot", "### Freeze"]) {
            expect(context).toContain(heading)
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("StatusEffect Base contracts", () => {
    const basePath = join(statusDir, "StatusEffect.ts")

    it("adds itself to target on start and removes on expire", () => {
        const source = readSource(basePath)
        expect(source).toContain("start()")
        expect(source).toContain("this.target.statusEffects.add(this)")
        expect(source).toContain("expire()")
        expect(source).toContain("this.target.statusEffects.delete(this)")
    })

    it("registers and cleans up target destruction listeners", () => {
        const source = readSource(basePath)
        expect(source).toContain("this.target.once(\"died\", this.expire, this)")
        expect(source).toContain("this.target.once(\"destroy\", this.expire, this)")
        expect(source).toContain("this.target.off(\"died\", this.expire, this)")
        expect(source).toContain("this.target.off(\"destroy\", this.expire, this)")
    })
})

describe("Condition contracts", () => {
    const condPath = join(statusDir, "Condition.ts")

    it("stores and restores modified attributes", () => {
        const source = readSource(condPath)
        expect(source).toContain("onApply()")
        expect(source).toContain("this.target.conditionsValues.set(key, this.target[key])")
        expect(source).toContain("onExpire()")
        expect(source).toContain("const originalValue = this.target.conditionsValues.get(attribute)")
        expect(source).toContain("this.target.conditionsValues.delete(attribute)")
    })
})

describe("Dot and Hot contracts", () => {
    it("Dot implements temporal damage ticking", () => {
        const source = readSource(join(statusDir, "Dot.ts"))
        expect(source).toContain("tick()")
        expect(source).toContain("this.user.calculateDamage")
        expect(source).toContain("this.target.takeDamage(damage, this.user, this.damageType, crit, true")
        expect(source).toContain("update(delta: number)")
        expect(source).toContain("this.timeSinceLastTick >= this.tickRate")
    })

    it("Hot implements temporal healing ticking", () => {
        const source = readSource(join(statusDir, "Hot.ts"))
        expect(source).toContain("tick()")
        expect(source).toContain("this.user.calculateDamage")
        expect(source).toContain("this.target.heal(value")
        expect(source).toContain("update(delta: number)")
        expect(source).toContain("this.timeSinceLastTick >= this.tickRate")
    })
})

describe("Freeze contracts", () => {
    it("Freeze implements Condition logic for the frozen attribute", () => {
        const source = readSource(join(statusDir, "Freeze.ts"))
        expect(source).toContain("export class Freeze extends Condition")
        expect(source).toContain("attributes: [\"frozen\"]")
        expect(source).toContain("values: [true]")
    })
})

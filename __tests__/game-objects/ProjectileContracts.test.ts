import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const projDir = join(root, "src/game/objects/Projectile")

const contextPath = join(root, "aicontext/game-projectiles.md")

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

describe("Projectile aicontext", () => {
    it("documents projectile contracts without numeric balance values", () => {
        const context = readSource(contextPath)

        for (const heading of ["### Projectile Lifecycle And Safety", "### Combat Resolution", "### Types Of Projectiles"]) {
            expect(context).toContain(heading)
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("Projectile Base contracts", () => {
    const projPath = join(projDir, "Projectile.ts")

    it("prevents double hits using a Set", () => {
        const source = readSource(projPath)
        expect(source).toContain("alreadyOverlaped = new Set<Creature>()")
        expect(source).toContain("if (this.alreadyOverlaped.has(enemy)) return")
        expect(source).toContain("this.alreadyOverlaped.add(enemy)")
    })

    it("cleans up resources explicitly on destroy", () => {
        const source = readSource(projPath)
        expect(source).toContain("destroy(fromScene?: boolean)")
        expect(source).toContain("this.watchdog.remove")
        expect(source).toContain("c.destroy()")
        expect(source).toContain("this.colliders.length = 0")
        expect(source).toContain("this.lightTween.stop()")
        expect(source).toContain("scene?.lights?.removeLight(this.light)")
    })

    it("delegates damage logic to owner without emitting duplicate afterAttack", () => {
        const source = readSource(projPath)
        expect(source).toContain("onHit(target: Creature)")
        expect(source).toContain("this.owner?.onAttackLand(this.damageType, target)")
        expect(source).not.toContain("this.owner?.onHit()")
    })
})

describe("Bouncing Projectile contracts", () => {
    it("LightningBolt implements bouncing resolution", () => {
        const source = readSource(join(projDir, "Lightningbolt.ts"))
        expect(source).toContain("getRemainingTargets()")
        expect(source).toContain("this.owner.getEnemyTeam().getChildren(true, true)")
        expect(source).toContain("nextFire(target: Creature")
        expect(source).toContain("this.bounces -= 1")
    })

    it("HolyShield implements bouncing resolution", () => {
        const source = readSource(join(projDir, "HolyShield.ts"))
        expect(source).toContain("getRemainingTargets()")
        expect(source).toContain("this.owner.getEnemyTeam().getChildren(true, true)")
        expect(source).toContain("this.bounces -= 1")
    })

    it("HolyShield critGuaranteed forces critical damage calculation", () => {
        const source = readSource(join(projDir, "HolyShield.ts"))

        expect(source).toContain("this.owner.calculateDamage(this.owner.attackDamage * 0.5 + this.owner.abilityPower * 0.5, this.critGuaranteed)")
        expect(source).toContain('target.takeDamage(value, this.owner, "holy", crit, true, this.owner.abilityName)')
    })
})

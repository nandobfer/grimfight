import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { basename, join } from "node:path"

const root = process.cwd()
const auraDir = join(root, "src/game/systems/Aura")
const auraPath = join(auraDir, "Aura.ts")
const paladinAuraPath = join(auraDir, "PaladinAura.ts")
const contextPath = join(root, "aicontext/game-auras.md")

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

function concreteAuraFiles() {
    return readdirSync(auraDir)
        .filter((file) => file.endsWith(".ts") && !["Aura.ts", "PaladinAura.ts"].includes(file))
        .sort()
}

function className(file: string) {
    return basename(file, ".ts")
}

describe("Aura aicontext", () => {
    it("documents aura systems without numeric balance values", () => {
        const context = readSource(contextPath)

        for (const heading of ["### Aura", "### PaladinAura", "### ProtectionAura", "### GuardianAura", "### SmiteAura"]) {
            expect(context).toContain(heading)
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("Aura base contracts", () => {
    it("defines params, ids, tryApply cleanup, and extension hooks", () => {
        const source = readSource(auraPath)

        expect(source).toContain("export interface AuraParams")
        expect(source).toContain("export class Aura")
        expect(source).toContain("id = RNG.uuid()")
        expect(source).toContain("constructor(params: AuraParams)")
        expect(source).toContain("applyModifier(creature: Creature)")
        expect(source).toContain("tryApply(creature: Creature)")
        expect(source).toContain("this.cleanup(creature)")
        expect(source).toContain("this.applyModifier(creature)")
        expect(source).toContain("afterApplying(creatures: Creature[])")
        expect(source).toContain("cleanup(creature: Creature)")
    })

    it("PaladinAura stores caster and FX and applies visual feedback", () => {
        const source = readSource(paladinAuraPath)

        expect(source).toContain("export class PaladinAura extends Aura")
        expect(source).toContain("caster: Lalatina")
        expect(source).toContain("fx: typeof HolyCrossFx")
        expect(source).toContain("constructor(caster: Lalatina")
        expect(source).toContain("super({ name })")
        expect(source).toContain("applyModifier(creature: Creature)")
        expect(source).toContain("new this.fx")
    })
})

describe("individual aura contracts", () => {
    it.each(concreteAuraFiles())("%s extends PaladinAura", (file) => {
        const source = readSource(join(auraDir, file))
        const name = className(file)

        expect(source).toMatch(new RegExp(`export class ${name} extends PaladinAura`))
        expect(source).toContain("constructor(caster: Lalatina)")
        expect(source).toContain("super(caster")
        expect(source).toContain("this.id = `")
    })

    it.each(concreteAuraFiles())("%s cleans registered listeners when it owns event handlers", (file) => {
        const source = readSource(join(auraDir, file))
        const ownsHandlers = source.includes("eventHandlers") || source.includes(".on(")

        if (!ownsHandlers) {
            expect(source).toBeTruthy()
            return
        }

        expect(source).toContain("cleanup")
        expect(source).toContain(".off(")
        expect(source).toContain("once(\"destroy\"")
    })
})

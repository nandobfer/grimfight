import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { basename, join } from "node:path"

const root = process.cwd()
const traitDir = join(root, "src/game/systems/Traits")
const traitPath = join(traitDir, "Trait.ts")
const registryPath = join(traitDir, "TraitsRegistry.ts")
const contextPath = join(root, "aicontext/game-traits.md")

const traitHeadings: Record<string, string> = {
    ArcanistTrait: "Arcanist",
    AssassinTrait: "Assassin",
    AttackerTrait: "Attacker",
    ClericTrait: "Cleric",
    ColossusTrait: "Colossi",
    DeathEaterTrait: "Deatheater",
    DruidTrait: "Druid",
    HolyTrait: "Holy",
    IncendiaryTrait: "Incendiary",
    NobleTrait: "Noble",
    PoisonerTrait: "Poisoner",
    WinterTrait: "Winter",
    SorcererTrait: "Sorcerer",
    SpeedyTrait: "Swift",
}

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

function traitFiles() {
    return readdirSync(traitDir)
        .filter((file) => file.endsWith(".ts") && !["Trait.ts", "TraitsRegistry.ts"].includes(file))
        .sort()
}

function className(file: string) {
    return basename(file, ".ts")
}

describe("Trait aicontext", () => {
    it("documents trait systems and concrete traits without numeric balance values", () => {
        const context = readSource(contextPath)

        expect(context).toContain("### Trait")
        expect(context).toContain("### TraitsRegistry")
        for (const file of traitFiles()) {
            expect(context).toContain(`### ${traitHeadings[className(file)]}`)
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("Trait base and registry contracts", () => {
    it("defines stage, composition, application, and cleanup hooks", () => {
        const source = readSource(traitPath)

        expect(source).toContain("export class Trait")
        expect(source).toContain("comp: string[]")
        expect(source).toContain("stages")
        expect(source).toContain("activeComp")
        expect(source).toContain("activeStage")
        expect(source).toContain("maxStage")
        expect(source).toContain("setMaxStage()")
        expect(source).toContain("applyModifier(character: Character)")
        expect(source).toContain("startApplying(characters: Character[])")
        expect(source).toContain("tryApply(character: Character)")
        expect(source).toContain("this.cleanup(character)")
        expect(source).toContain("this.applyModifier(character)")
        expect(source).toContain("afterApplying(characters: Character[])")
        expect(source).toContain("cleanup(character: Character)")
        expect(source).toContain("getActiveStage()")
    })

    it("registers, creates, restores, lists, and matches traits by composition", () => {
        const source = readSource(registryPath)

        expect(source).toContain("private static registry")
        expect(source).toContain("static register")
        expect(source).toContain("static getAllRegistered")
        expect(source).toContain("static create")
        expect(source).toContain("throw new Error(`Trait not found: ${name}`)")
        expect(source).toContain("Object.entries(data)")
        expect(source).toContain("static names")
        expect(source).toContain("static entries")
        expect(source).toContain("static random")
        expect(source).toContain("static randomList")
        expect(source).toContain("static compTraits")
    })

    it("registered trait constructors point to existing concrete files", () => {
        const source = readSource(registryPath)
        const files = new Set(traitFiles().map(className))
        const registeredClasses = Array.from(source.matchAll(/TraitsRegistry\.register\("[^"]+", (\w+)/g)).map((match) => match[1])

        expect(registeredClasses.length).toBeGreaterThan(0)
        for (const registeredClass of registeredClasses) {
            expect(files.has(registeredClass)).toBe(true)
        }
    })

    it("keeps Arthas aligned with noble winter deatheater traits", () => {
        const source = readSource(registryPath)

        expect(source).toMatch(/TraitsRegistry\.register\("Attacker", AttackerTrait, \[[^\]]*\]/)
        expect(source.match(/TraitsRegistry\.register\("Attacker", AttackerTrait, \[[^\]]*\]/)?.[0]).not.toContain("arthas")
        expect(source.match(/TraitsRegistry\.register\("Deatheater", DeathEaterTrait, \[[^\]]*\]/)?.[0]).toContain("arthas")
        expect(source.match(/TraitsRegistry\.register\("Noble", NobleTrait, \[[^\]]*\]/)?.[0]).toContain("arthas")
        expect(source.match(/TraitsRegistry\.register\("Winter", WinterTrait, \[[^\]]*\]/)?.[0]).toContain("arthas")
    })
})

describe("individual trait contracts", () => {
    it.each(traitFiles())("%s exports a Trait subclass", (file) => {
        const source = readSource(join(traitDir, file))
        const name = className(file)

        expect(source).toMatch(new RegExp(`export class ${name} extends Trait`))
        expect(source).toContain("constructor(comp: string[])")
        expect(source).toContain("super(comp)")
    })

    it.each(traitFiles())("%s cleans registered listeners when it owns event handlers", (file) => {
        const source = readSource(join(traitDir, file))
        const ownsHandlers = source.includes("eventHandlers") || source.includes(".on(") || source.includes("team.on")

        if (!ownsHandlers) {
            expect(source).toBeTruthy()
            return
        }

        expect(source).toContain("cleanup")
        expect(source).toMatch(/\.off\(|team\.off/)
        expect(source).toContain("once(\"destroy\"")
    })

    it("Assassin uses bounded execute damage instead of permanent kill scaling", () => {
        const source = readSource(join(traitDir, "AssassinTrait.ts"))

        expect(source).toContain("bonusCritChance")
        expect(source).toContain("bonusCritDamageMultiplier")
        expect(source).toContain("executeDamageMultiplier")
        expect(source).toContain("executeHealthThreshold")
        expect(source).toContain("[6, { bonusCritChance: 60")
        expect(source).toContain("character.critDamageMultiplier += values.bonusCritDamageMultiplier")
        expect(source).toContain("character.on(\"dealt-damage\", executeWoundedTarget)")
        expect(source).toContain("character.off(\"dealt-damage\", handler)")
        expect(source).toContain("target.takeDamage(damage * values.executeDamageMultiplier, character, \"true\", false, false, this.name)")
        expect(source).not.toContain("baseCritDamageMultiplier +=")
        expect(source).not.toContain("character.on(\"kill\"")
    })

    it("Poisoner converts only poison damage into nervous system shock true damage", () => {
        const source = readSource(join(traitDir, "PoisonerTrait.ts"))

        expect(source).toContain("[2, { damageMultiplier: 0.2")
        expect(source).toContain("[4, { damageMultiplier: 0.4")
        expect(source).not.toContain("[3, { damageMultiplier")
        expect(source).toContain("if (damageType !== \"poison\") return")
        expect(source).toContain("target.takeDamage(extraDamage, character, \"true\", false, false, nervousSystemShockSource)")
        expect(source).toContain("Nervous System Shock")
    })

    it("Incendiary only burns the active target from a completed cast", () => {
        const source = readSource(join(traitDir, "IncendiaryTrait.ts"))

        expect(source).toContain("const target = character.target")
        expect(source).toContain("if (!target?.active || !target.canBeTargeted) return")
        expect(source).toContain("target,")
    })
})

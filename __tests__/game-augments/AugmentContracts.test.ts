import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { basename, join } from "node:path"

const root = process.cwd()
const augmentDir = join(root, "src/game/systems/Augment")
const augmentPath = join(augmentDir, "Augment.ts")
const registryPath = join(augmentDir, "AugmentsRegistry.ts")
const contextPath = join(root, "aicontext/game-augments.md")

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

function augmentFiles() {
    return readdirSync(augmentDir)
        .filter((file) => file.endsWith(".ts") && !["Augment.ts", "AugmentsRegistry.ts"].includes(file))
        .sort()
}

function className(file: string) {
    return basename(file, ".ts")
}

describe("Augment aicontext", () => {
    it("documents augment systems and concrete augments without numeric balance values", () => {
        const context = readSource(contextPath)

        for (const heading of ["### Augment", "### AugmentsRegistry", "### Stat Augments", "### Economy And Item Augments", "### Anvil Flow"]) {
            expect(context).toContain(heading)
        }

        for (const file of augmentFiles()) {
            expect(context).toContain(className(file))
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("Augment base and registry contracts", () => {
    it("defines serializable augment metadata and extension hooks", () => {
        const source = readSource(augmentPath)

        expect(source).toContain("export class Augment")
        expect(source).toContain("chosenFloor")
        expect(source).toContain("values")
        expect(source).toContain("descriptionValues")
        expect(source).toContain("color?")
        expect(source).toContain("constructor(name: string")
        expect(source).toContain("applyModifier(creature: Creature)")
        expect(source).toContain("onPick(team: CreatureGroup)")
    })

    it("registers, creates, restores, lists, and randomly selects augments", () => {
        const source = readSource(registryPath)

        expect(source).toContain("private static registry")
        expect(source).toContain("static register")
        expect(source).toContain("static create")
        expect(source).toContain("throw new Error(`Augment not found: ${name}`)")
        expect(source).toContain("Object.entries(data)")
        expect(source).toContain("static names")
        expect(source).toContain("static entries")
        expect(source).toContain("static random")
        expect(source).toContain("static randomList")
    })

    it("registered augment constructors point to existing concrete files", () => {
        const source = readSource(registryPath)
        const files = new Set(augmentFiles().map(className))
        const registeredClasses = Array.from(source.matchAll(/AugmentsRegistry\.register\("[^"]+", (\w+)\)/g)).map((match) => match[1])

        expect(registeredClasses.length).toBeGreaterThan(0)
        for (const registeredClass of registeredClasses) {
            expect(files.has(registeredClass)).toBe(true)
        }
    })
})

describe("individual augment contracts", () => {
    it.each(augmentFiles())("%s exports an Augment subclass", (file) => {
        const source = readSource(join(augmentDir, file))
        const name = className(file)

        expect(source).toMatch(new RegExp(`export class ${name} extends (Augment|AnvilAugment)`))
        expect(source).toContain("constructor")
    })

    it.each(augmentFiles())("%s declares a modifier or pick behavior", (file) => {
        const source = readSource(join(augmentDir, file))

        expect(source.includes("applyModifier") || source.includes("onPick")).toBe(true)
    })
})

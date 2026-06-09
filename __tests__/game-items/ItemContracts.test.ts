import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { basename, join } from "node:path"

const root = process.cwd()
const itemsDir = join(root, "src/game/systems/Items")
const itemPath = join(itemsDir, "Item.ts")
const itemRegistryPath = join(itemsDir, "ItemRegistry.ts")
const contextPath = join(root, "aicontext/game-items.md")

type ItemCategory = "components" | "completed" | "artifact"

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

function itemFiles(category: ItemCategory) {
    return readdirSync(join(itemsDir, category))
        .filter((file) => file.endsWith(".ts"))
        .sort()
}

function className(file: string) {
    return basename(file, ".ts")
}

function keyFromClass(name: string) {
    return name.toLowerCase()
}

describe("Item aicontext", () => {
    it("documents item systems and item catalogs without numeric balance values", () => {
        const context = readSource(contextPath)

        for (const heading of ["### Item", "### ItemRegistry", "### Components", "### Completed Items", "### Artifacts", "### Drag Tooltip And Snap", "### Thiefsgloves"]) {
            expect(context).toContain(heading)
        }

        for (const file of [...itemFiles("components"), ...itemFiles("completed"), ...itemFiles("artifact")]) {
            expect(context).toContain(className(file))
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("Item base contracts", () => {
    it("manages tooltip, merge cache, sprite lifecycle, drag, snap, drop, and sync", () => {
        const source = readSource(itemPath)

        expect(source).toContain("export class Item")
        expect(source).toContain("static resetTooltip()")
        expect(source).toContain("EventBus.emit(\"item-tooltip\", null)")
        expect(source).toContain("static getMergeResult")
        expect(source).toContain("mergeResultCache")
        expect(source).toContain("ItemRegistry.getCombinationResult")
        expect(source).toContain("static isThiefsGloves")
        expect(source).toContain("if (!dataOnly)")
        expect(source).toContain("this.handleMouseEvents()")
        expect(source).toContain("this.sprite.once(\"destroy\"")
        expect(source).toContain("scene.events.once(\"gameover\"")
        expect(source).toContain("applyModifier(creature: Creature)")
        expect(source).toContain("afterApplying(characters: Creature[])")
        expect(source).toContain("cleanup(creature: Creature)")
        expect(source).toContain("handleMouseEvents(): void")
        expect(source).toContain("this.scene.input.setDraggable(this.sprite)")
        expect(source).toContain("if (this.scene.state !== \"idle\") return")
        expect(source).toContain("handleCreatureOnPoint")
        expect(source).toContain("handleItemOnPoint")
        expect(source).toContain("removeDragHandlers()")
        expect(source).toContain("snapToCreature(creature: Creature)")
        expect(source).toContain("dropOnBoard()")
        expect(source).toContain("drop()")
        expect(source).toContain("syncPosition(creature: Creature")
    })
})

describe("ItemRegistry contracts", () => {
    it("registers item categories, recipes, creation, random selection, and recipe lookup", () => {
        const source = readSource(itemRegistryPath)

        expect(source).toContain("private static componentRegistry")
        expect(source).toContain("private static completedRegistry")
        expect(source).toContain("private static artifactRegistry")
        expect(source).toContain("private static registry")
        expect(source).toContain("private static recipes")
        expect(source).toContain("static registerArtifact")
        expect(source).toContain("static registerComponent")
        expect(source).toContain("static registerCompleted")
        expect(source).toContain("this.recipes.push")
        expect(source).toContain("static create")
        expect(source).toContain("throw new Error(`Item class not found: ${name}`)")
        expect(source).toContain("static entries")
        expect(source).toContain("static components")
        expect(source).toContain("static completed")
        expect(source).toContain("static artifacts")
        expect(source).toContain("static randomComponent")
        expect(source).toContain("static randomCompleted")
        expect(source).toContain("static randomArtifact")
        expect(source).toContain("static merge")
        expect(source).toContain("static getCombinationResult")
        expect(source).toContain("static isComponent")
        expect(source).toContain("static isArtifact")
        expect(source).toContain("static getComponentRecipes")
    })

    it.each(itemFiles("components"))("registers component %s", (file) => {
        const registrySource = readSource(itemRegistryPath)
        const name = className(file)

        expect(registrySource).toContain(`import { ${name} }`)
        expect(registrySource).toContain(`ItemRegistry.registerComponent("${keyFromClass(name)}", ${name})`)
    })

    it.each(itemFiles("completed"))("imports completed item %s", (file) => {
        const registrySource = readSource(itemRegistryPath)
        const name = className(file)

        expect(registrySource).toContain(`import { ${name} }`)
    })

    it("completed item registrations point to existing completed item files", () => {
        const registrySource = readSource(itemRegistryPath)
        const files = new Set(itemFiles("completed").map(className))
        const registeredClasses = Array.from(registrySource.matchAll(/ItemRegistry\.registerCompleted\("[^"]+", (\w+)/g)).map((match) => match[1])

        expect(registeredClasses.length).toBeGreaterThan(0)
        for (const registeredClass of registeredClasses) {
            expect(files.has(registeredClass)).toBe(true)
        }
    })

    it.each(itemFiles("artifact"))("registers artifact %s", (file) => {
        const registrySource = readSource(itemRegistryPath)
        const name = className(file)

        expect(registrySource).toContain(`import { ${name} }`)
        expect(registrySource).toContain(`ItemRegistry.registerArtifact("${keyFromClass(name)}", ${name})`)
    })
})

describe("individual item file contracts", () => {
    it.each([
        ...itemFiles("components").map((file) => ["components", file] as const),
        ...itemFiles("completed").map((file) => ["completed", file] as const),
        ...itemFiles("artifact").map((file) => ["artifact", file] as const),
    ])("%s/%s extends Item and defines display metadata", (category, file) => {
        const source = readSource(join(itemsDir, category, file))
        const name = className(file)

        expect(source).toMatch(new RegExp(`export class ${name} extends Item`))
        expect(source).toContain(`key = "${keyFromClass(name)}"`)
        expect(source).toContain("name =")
        expect(source).toContain("descriptionLines")
        expect(source).toContain("constructor(scene: Game")
        expect(source).toContain("super(scene, \"item-")
    })

    it.each([
        ...itemFiles("completed").map((file) => ["completed", file] as const),
        ...itemFiles("artifact").map((file) => ["artifact", file] as const),
    ])("%s/%s cleans registered listeners when it owns event handlers", (category, file) => {
        const source = readSource(join(itemsDir, category, file))
        const ownsHandlers = source.includes("eventHandlers") || source.includes(".on(") || source.includes("scene.events.on")

        if (!ownsHandlers) {
            expect(source).toBeTruthy()
            return
        }

        expect(source).toContain("cleanup")
        expect(source).toMatch(/\.off\(|scene\.events\.off/)
    })
})

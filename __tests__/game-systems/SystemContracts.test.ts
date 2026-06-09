import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const systemsDir = join(root, "src/game/systems")

const systemContracts = [
    {
        name: "Summon",
        sourcePath: join(systemsDir, "Summon.ts"),
        contextPath: join(root, "aicontext/game-summon.md"),
        headings: ["### Summon"],
    },
    {
        name: "Shopkeeper",
        sourcePath: join(systemsDir, "Shopkeeper.ts"),
        contextPath: join(root, "aicontext/game-shopkeeper.md"),
        headings: ["### Shopkeeper", "### Store Integration"],
    },
    {
        name: "Tavern",
        sourcePath: join(systemsDir, "Tavern.ts"),
        contextPath: join(root, "aicontext/game-tavern.md"),
        headings: ["### Tavern", "### Bench Integration"],
    },
    {
        name: "GameRecord",
        sourcePath: join(systemsDir, "GameRecord.ts"),
        contextPath: join(root, "aicontext/game-records.md"),
        headings: ["### GameRecord"],
    },
]

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

describe("top-level system aicontext", () => {
    it.each(systemContracts)("documents $name without numeric balance values", (contract) => {
        const context = readSource(contract.contextPath)

        for (const heading of contract.headings) {
            expect(context).toContain(heading)
        }

        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("Summon contracts", () => {
    it("creates monster minions through registry and syncs them with the master", () => {
        const source = readSource(join(systemsDir, "Summon.ts"))

        expect(source).toContain("export interface SummonOpts")
        expect(source).toContain("export class Summon")
        expect(source).toContain("static summon")
        expect(source).toContain("MonsterRegistry.create(monster, master.scene)")
        expect(source).toContain("summon.master = master")
        expect(source).toContain("master.team.minions.add(summon)")
        expect(source).toContain("master.randomPointAround(true)")
        expect(source).toContain("new MagicCircleFx")
        expect(source).toContain("summon.teleportTo(x, y)")
        expect(source).toContain("summon.boardX = master.boardX")
        expect(source).toContain("summon.boardY = master.boardY")
        expect(source).toContain("summon.reset()")
        expect(source).toContain("summon.applyAuras()")
        expect(source).toContain("summon.target = master.target")
        expect(source).toContain("return summon")
    })
})

describe("Shopkeeper contracts", () => {
    it("bridges character selling, store toggling, visual feedback, and cleanup", () => {
        const source = readSource(join(systemsDir, "Shopkeeper.ts"))

        expect(source).toContain("export class Shopkeeper extends Phaser.GameObjects.Image")
        expect(source).toContain("this.store = this.scene.playerTeam.store")
        expect(source).toContain("this.costText = this.scene.add")
        expect(source).toContain("this.coinSprite = this.scene.add")
        expect(source).toContain("handleMouseEvents(): void")
        expect(source).toContain("EventBus.on(\"sell-character-shopkeeper\", onSell)")
        expect(source).toContain("this.store.sell(character)")
        expect(source).toContain("this.on(\"pointerover\"")
        expect(source).toContain("this.on(\"pointerout\"")
        expect(source).toContain("this.on(\"pointerup\"")
        expect(source).toContain("EventBus.emit(\"toggle-store\")")
        expect(source).toContain("EventBus.off(\"sell-character-shopkeeper\", onSell)")
        expect(source).toContain("this.removeAllListeners()")
        expect(source).toContain("renderCharacterCost")
        expect(source).toContain("hideCharacterCost")
    })
})

describe("Tavern contracts", () => {
    it("bridges bench drops, bench toggling, visual feedback, and cleanup", () => {
        const source = readSource(join(systemsDir, "Tavern.ts"))

        expect(source).toContain("export class Tavern extends Phaser.GameObjects.Image")
        expect(source).toContain("this.bench = this.scene.playerTeam.bench")
        expect(source).toContain("this.text = this.scene.add")
        expect(source).toContain("handleMouseEvents(): void")
        expect(source).toContain("EventBus.on(\"bench-character-tavern\", onBench)")
        expect(source).toContain("const dto = character.getDto()")
        expect(source).toContain("character.onBenchDrop()")
        expect(source).toContain("this.bench.add(dto)")
        expect(source).toContain("this.on(\"pointerover\"")
        expect(source).toContain("this.on(\"pointerout\"")
        expect(source).toContain("this.on(\"pointerup\"")
        expect(source).toContain("EventBus.emit(\"toggle-bench\")")
        expect(source).toContain("EventBus.off(\"bench-character-tavern\", onBench)")
        expect(source).toContain("this.removeAllListeners()")
        expect(source).toContain("renderStoreLabel")
        expect(source).toContain("hideStoreLabel")
    })
})

describe("GameRecord contracts", () => {
    it("declares local run record fields and DTO dependencies", () => {
        const source = readSource(join(systemsDir, "GameRecord.ts"))

        expect(source).toContain("import { CharacterDto }")
        expect(source).toContain("import { Augment }")
        expect(source).toContain("export class GameRecord")
        expect(source).toContain("finishedAt: number")
        expect(source).toContain("floor: number")
        expect(source).toContain("comp: CharacterDto[]")
        expect(source).toContain("augments: Augment[]")
    })
})

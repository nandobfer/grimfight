import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { EventEmitter } from "node:events"
import { EventBus } from "../../src/game/tools/EventBus"

vi.mock("phaser", () => ({
    Events: {
        EventEmitter,
    },
}))

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

class FakeImage {
    eventHandlers = new Map<string, Array<(...args: unknown[]) => void>>()
    postFX = {
        addGlow: vi.fn(() => ({ outerStrength: 0 })),
    }
    scene: unknown
    x: number
    y: number

    constructor(scene: unknown, x: number, y: number) {
        this.scene = scene
        this.x = x
        this.y = y
    }

    setPipeline = vi.fn(() => this)
    setScale = vi.fn(() => this)
    setInteractive = vi.fn(() => this)
    removeAllListeners = vi.fn(() => {
        this.eventHandlers.clear()
        return this
    })
    destroy = vi.fn(() => undefined)

    on(event: string, handler: (...args: unknown[]) => void) {
        this.eventHandlers.set(event, [...(this.eventHandlers.get(event) ?? []), handler])
        return this
    }

    emit(event: string, ...args: unknown[]) {
        for (const handler of this.eventHandlers.get(event) ?? []) {
            handler(...args)
        }
    }
}

function chainableText() {
    return {
        setOrigin: vi.fn(function (this: unknown) {
            return this
        }),
        setVisible: vi.fn(function (this: unknown) {
            return this
        }),
        setShadow: vi.fn(function (this: unknown) {
            return this
        }),
        setPipeline: vi.fn(function (this: unknown) {
            return this
        }),
        setText: vi.fn(function (this: unknown) {
            return this
        }),
        destroy: vi.fn(),
    }
}

function chainableSprite() {
    return {
        width: 0,
        setScale: vi.fn(function (this: unknown) {
            return this
        }),
        setVisible: vi.fn(function (this: unknown) {
            return this
        }),
        play: vi.fn(function (this: unknown) {
            return this
        }),
        setPosition: vi.fn(function (this: unknown) {
            return this
        }),
        destroy: vi.fn(),
    }
}

function makeScene() {
    return {
        background: { x: 100, y: 100, width: 300, height: 300 },
        add: {
            existing: vi.fn(),
            text: vi.fn(() => chainableText()),
            sprite: vi.fn(() => chainableSprite()),
        },
        anims: {
            exists: vi.fn(() => true),
            create: vi.fn(),
            generateFrameNumbers: vi.fn(() => []),
        },
        tweens: {
            add: vi.fn(),
        },
        playerTeam: {
            store: {
                sell: vi.fn(),
                getCost: vi.fn(() => 1),
            },
            bench: {
                add: vi.fn(),
            },
        },
    }
}

beforeEach(() => {
    vi.stubGlobal("Phaser", {
        GameObjects: {
            Image: FakeImage,
        },
    })
    EventBus.removeAllListeners()
})

afterEach(() => {
    EventBus.removeAllListeners()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

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
    it("sells emitted characters and removes its EventBus listener on dispose", async () => {
        const { Shopkeeper } = await import("../../src/game/systems/Shopkeeper")
        const scene = makeScene()
        const shopkeeper = new Shopkeeper(scene as never)
        const character = { level: 1 }

        EventBus.emit("sell-character-shopkeeper", character)
        expect(scene.playerTeam.store.sell).toHaveBeenCalledWith(character)

        shopkeeper.dispose()
        EventBus.emit("sell-character-shopkeeper", character)

        expect(scene.playerTeam.store.sell).toHaveBeenCalledTimes(1)
        expect(shopkeeper.removeAllListeners).toHaveBeenCalledOnce()
    })

    it("emits store toggles from pointer interaction", async () => {
        const { Shopkeeper } = await import("../../src/game/systems/Shopkeeper")
        const scene = makeScene()
        const shopkeeper = new Shopkeeper(scene as never)
        const onToggleStore = vi.fn()

        EventBus.on("toggle-store", onToggleStore)
        shopkeeper.emit("pointerup")

        expect(onToggleStore).toHaveBeenCalledOnce()
    })
})

describe("Tavern contracts", () => {
    it("benches emitted characters and removes its EventBus listener on dispose", async () => {
        const { Tavern } = await import("../../src/game/systems/Tavern")
        const scene = makeScene()
        const tavern = new Tavern(scene as never)
        const dto = { id: "char-1", name: "dracula", level: 1 }
        const character = {
            getDto: vi.fn(() => dto),
            onBenchDrop: vi.fn(),
        }

        EventBus.emit("bench-character-tavern", character)

        expect(character.getDto).toHaveBeenCalledOnce()
        expect(character.onBenchDrop).toHaveBeenCalledOnce()
        expect(scene.playerTeam.bench.add).toHaveBeenCalledWith(dto)

        tavern.dispose()
        EventBus.emit("bench-character-tavern", character)

        expect(scene.playerTeam.bench.add).toHaveBeenCalledTimes(1)
        expect(tavern.removeAllListeners).toHaveBeenCalledOnce()
    })

    it("emits bench toggles from pointer interaction", async () => {
        const { Tavern } = await import("../../src/game/systems/Tavern")
        const scene = makeScene()
        const tavern = new Tavern(scene as never)
        const onToggleBench = vi.fn()

        EventBus.on("toggle-bench", onToggleBench)
        tavern.emit("pointerup")

        expect(onToggleBench).toHaveBeenCalledOnce()
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

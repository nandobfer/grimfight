import { describe, expect, it, vi } from "vitest"

// `InventoryBag` only reaches Phaser through `Phaser.Math.Clamp` at runtime and
// `EventBus` only needs `Phaser.Events.EventEmitter`. Replacing the module lets
// this test build the real class in Node without booting the engine (which needs
// a DOM). The factory stays self-contained so nothing is read before init.
vi.mock("phaser", () => {
    class FakeEventEmitter {
        private handlers = new Map<string, Set<(...args: unknown[]) => void>>()

        on(event: string, handler: (...args: unknown[]) => void) {
            const set = this.handlers.get(event) ?? new Set()
            set.add(handler)
            this.handlers.set(event, set)
            return this
        }

        once(event: string, handler: (...args: unknown[]) => void) {
            const wrapper = (...args: unknown[]) => {
                this.off(event, wrapper)
                handler(...args)
            }
            return this.on(event, wrapper)
        }

        off(event: string, handler: (...args: unknown[]) => void) {
            this.handlers.get(event)?.delete(handler)
            return this
        }

        emit(event: string, ...args: unknown[]) {
            const set = this.handlers.get(event)
            if (!set) return false

            for (const handler of [...set]) handler(...args)
            return true
        }

        removeAllListeners(event?: string) {
            if (event) this.handlers.delete(event)
            else this.handlers.clear()
            return this
        }
    }

    return {
        default: {
            Math: {
                Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
            },
            Events: {
                EventEmitter: FakeEventEmitter,
            },
        },
        // `EventBus` uses a named import.
        Events: {
            EventEmitter: FakeEventEmitter,
        },
    }
})

import { InventoryBag } from "../../src/game/ui/InventoryBag"
import type { ItemInventory } from "../../src/game/systems/Items/ItemInventory"
import type { Game } from "../../src/game/scenes/Game"

/** Arena used by the double, mirroring the scaled background bounds. */
const REGION = { x: 100, y: 100, width: 400, height: 300 }
const VIEWPORT = { width: 768, height: 768 }

type FakeKind = "image" | "text" | "container" | "rectangle" | "graphics"

interface FakeGameObject {
    kind: FakeKind
    x: number
    y: number
    displayWidth: number
    displayHeight: number
    visible: boolean
    text: string
    textureKey: string
    destroyed: boolean
    listeners: string[]
    add(children: unknown): FakeGameObject
    clear(): FakeGameObject
    clearTint(): FakeGameObject
    destroy(): FakeGameObject
    fillRoundedRect(): FakeGameObject
    fillStyle(): FakeGameObject
    lineBetween(): FakeGameObject
    lineStyle(): FakeGameObject
    off(event: string): FakeGameObject
    on(event: string): FakeGameObject
    setDepth(): FakeGameObject
    setDisplaySize(width: number, height: number): FakeGameObject
    setInteractive(): FakeGameObject
    setOrigin(): FakeGameObject
    setPosition(x: number, y: number): FakeGameObject
    setRotation(): FakeGameObject
    setScale(): FakeGameObject
    setText(text: string): FakeGameObject
    setTint(): FakeGameObject
    setVisible(visible: boolean): FakeGameObject
    strokeRoundedRect(): FakeGameObject
}

/** Minimal chainable Phaser game object double. */
function fakeGameObject(kind: FakeKind, x = 0, y = 0): FakeGameObject {
    const object: FakeGameObject = {
        kind,
        x,
        y,
        displayWidth: 0,
        displayHeight: 0,
        visible: true,
        text: "",
        textureKey: "",
        destroyed: false,
        listeners: [],
        add: () => object,
        clear: () => object,
        clearTint: () => object,
        destroy: () => {
            object.destroyed = true
            return object
        },
        fillRoundedRect: () => object,
        fillStyle: () => object,
        lineBetween: () => object,
        lineStyle: () => object,
        off: () => object,
        on: (event: string) => {
            object.listeners.push(event)
            return object
        },
        setDepth: () => object,
        setDisplaySize: (width: number, height: number) => {
            object.displayWidth = width
            object.displayHeight = height
            return object
        },
        setInteractive: () => object,
        setOrigin: () => object,
        setPosition: (nextX: number, nextY: number) => {
            object.x = nextX
            object.y = nextY
            return object
        },
        setRotation: () => object,
        setScale: () => object,
        setText: (value: string) => {
            object.text = value
            return object
        },
        setTint: () => object,
        setVisible: (value: boolean) => {
            object.visible = value
            return object
        },
        strokeRoundedRect: () => object,
    }

    return object
}

function createSceneDouble() {
    const created: FakeGameObject[] = []
    const track = (object: FakeGameObject) => {
        created.push(object)
        return object
    }

    const scene = {
        background: { getBounds: () => ({ ...REGION }) },
        cameras: { main: { width: VIEWPORT.width, height: VIEWPORT.height } },
        sys: { game: { device: { os: { android: false, iOS: false } } } },
        add: {
            image: (x: number, y: number, key: string) => {
                const object = track(fakeGameObject("image", x, y))
                object.textureKey = key
                return object
            },
            text: (x: number, y: number, value: string) => {
                const object = track(fakeGameObject("text", x, y))
                object.text = value
                return object
            },
            container: (x: number, y: number) => track(fakeGameObject("container", x, y)),
            rectangle: () => track(fakeGameObject("rectangle")),
            graphics: () => track(fakeGameObject("graphics")),
        },
        input: {
            dragDistanceThreshold: 0,
            setDraggable: () => undefined,
            on: () => undefined,
            off: () => undefined,
        },
    }

    return { scene: scene as unknown as Game, created }
}

function createInventoryDouble() {
    const items: unknown[] = []

    return {
        size: 0,
        snapshot: () => ({ artifact: [], completed: [], component: [] }),
        categoryOf: () => "component",
        reorder: () => undefined,
        [Symbol.iterator]: () => items[Symbol.iterator](),
    } as unknown as ItemInventory
}

function bagSprite(created: FakeGameObject[]) {
    const sprite = created.find((object) => object.kind === "image")
    if (!sprite) throw new Error("InventoryBag did not create its bag sprite")
    return sprite
}

function expectInsideRegion(bag: InventoryBag, sprite: FakeGameObject) {
    const position = bag.getPosition()
    const halfWidth = sprite.displayWidth / 2
    const halfHeight = sprite.displayHeight / 2

    expect(position.x).toBeGreaterThanOrEqual(REGION.x + halfWidth)
    expect(position.x).toBeLessThanOrEqual(REGION.x + REGION.width - halfWidth)
    expect(position.y).toBeGreaterThanOrEqual(REGION.y + halfHeight)
    expect(position.y).toBeLessThanOrEqual(REGION.y + REGION.height - halfHeight)
}

describe("InventoryBag initialization", () => {
    it("builds the bag before reading any sprite measurement", () => {
        const { scene, created } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble())

        const sprite = bagSprite(created)
        expect(sprite.textureKey).toBe("inventory-bag")
        expect(sprite.displayWidth).toBeGreaterThan(0)
        expect(sprite.displayHeight).toBeGreaterThan(0)

        bag.dispose()
    })

    it("spawns a random position fully inside the arena", () => {
        for (let attempt = 0; attempt < 25; attempt++) {
            const { scene, created } = createSceneDouble()
            const bag = new InventoryBag(scene, createInventoryDouble())

            expectInsideRegion(bag, bagSprite(created))
            bag.dispose()
        }
    })

    it("keeps a valid saved position", () => {
        const { scene, created } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble(), { x: 250, y: 250 })

        expect(bag.getPosition()).toEqual({ x: 250, y: 250 })
        expectInsideRegion(bag, bagSprite(created))

        bag.dispose()
    })

    it("clamps a saved position that no longer fits the arena", () => {
        const { scene, created } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble(), { x: -5000, y: 5000 })
        const sprite = bagSprite(created)

        expect(bag.getPosition()).toEqual({ x: REGION.x + sprite.displayWidth / 2, y: REGION.y + REGION.height - sprite.displayHeight / 2 })

        bag.dispose()
    })

    it("opens, closes and reopens the panel without throwing", () => {
        const { scene } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble())

        expect(() => bag.open()).not.toThrow()
        expect(() => bag.close()).not.toThrow()
        expect(() => bag.open()).not.toThrow()
        expect(() => bag.toggle()).not.toThrow()

        bag.dispose()
    })

    it("keeps the bag inside the arena when it spawns again", () => {
        const { scene, created } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble())

        bag.spawnRandom()

        expectInsideRegion(bag, bagSprite(created))
        bag.dispose()
    })

    it("destroys its Phaser objects on dispose", () => {
        const { scene, created } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble())

        bag.dispose()

        expect(bagSprite(created).destroyed).toBe(true)
        expect(created.find((object) => object.kind === "container")?.destroyed).toBe(true)
    })
})

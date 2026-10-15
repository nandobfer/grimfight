import { describe, expect, it, vi } from "vitest"

// `InventoryBag` only reaches Phaser through `Phaser.Math.Clamp` at runtime and
// `EventBus` only needs `Phaser.Events.EventEmitter`. Replacing the module lets
// this test build the real class in Node without booting the engine (which needs
// a DOM). The factory stays self-contained so nothing is read before init.
vi.mock("phaser", () => {
    class FakeRectangle {
        x: number
        y: number
        width: number
        height: number

        constructor(x = 0, y = 0, width = 0, height = 0) {
            this.x = x
            this.y = y
            this.width = width
            this.height = height
        }

        setSize(width: number, height: number) {
            this.width = width
            this.height = height
            return this
        }

        static Contains(rect: { x: number; y: number; width: number; height: number }, x: number, y: number) {
            return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
        }
    }

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
            Geom: {
                Rectangle: FakeRectangle,
            },
        },
        // `EventBus` uses a named import.
        Events: {
            EventEmitter: FakeEventEmitter,
        },
    }
})

import { InventoryBag } from "../../src/game/ui/InventoryBag"
import { EventBus } from "../../src/game/tools/EventBus"
import { ITEM_FLY_DEPTH } from "../../src/game/systems/Items/InventoryDepths"
import type { ItemInventory } from "../../src/game/systems/Items/ItemInventory"
import type { Game } from "../../src/game/scenes/Game"

/** Arena used by the double, mirroring the scaled background bounds. */
const REGION = { x: 100, y: 100, width: 420, height: 320 }
const VIEWPORT = { width: 768, height: 768 }

type FakeKind = "image" | "text" | "container" | "rectangle" | "graphics"

interface FakeGameObject {
    kind: FakeKind
    x: number
    y: number
    width: number
    height: number
    displayWidth: number
    displayHeight: number
    visible: boolean
    interactive: boolean
    text: string
    textureKey: string
    destroyed: boolean
    listeners: string[]
    masks: unknown[]
    children: FakeGameObject[]
    hitArea?: { width: number; height: number }
    texture?: { key: string }
    depth: number
    scale: number
    scaleX: number
    add(children: FakeGameObject | FakeGameObject[]): FakeGameObject
    clear(): FakeGameObject
    clearMask(): FakeGameObject
    clearTint(): FakeGameObject
    createGeometryMask(): { destroy: () => void }
    destroy(withChildren?: boolean): FakeGameObject
    disableInteractive(): FakeGameObject
    fillRect(): FakeGameObject
    fillRoundedRect(): FakeGameObject
    fillStyle(): FakeGameObject
    lineBetween(): FakeGameObject
    lineStyle(): FakeGameObject
    off(event: string): FakeGameObject
    on(event: string): FakeGameObject
    setDepth(): FakeGameObject
    setDisplaySize(width: number, height: number): FakeGameObject
    setFillStyle(): FakeGameObject
    setInteractive(): FakeGameObject
    setMask(mask: unknown): FakeGameObject
    setOrigin(): FakeGameObject
    setPosition(x: number, y: number): FakeGameObject
    setRotation(): FakeGameObject
    setScale(): FakeGameObject
    setSize(width: number, height: number): FakeGameObject
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
        width: 0,
        height: 0,
        displayWidth: 0,
        displayHeight: 0,
        visible: true,
        // Phaser game objects are only interactive after `setInteractive` runs.
        interactive: false,
        text: "",
        textureKey: "",
        depth: 0,
        scale: 1,
        scaleX: 1,
        destroyed: false,
        listeners: [],
        masks: [],
        children: [],
        add: (children: FakeGameObject | FakeGameObject[]) => {
            for (const child of Array.isArray(children) ? children : [children]) object.children.push(child)
            return object
        },
        clear: () => object,
        clearMask: () => {
            object.masks = []
            return object
        },
        clearTint: () => object,
        createGeometryMask: () => ({ destroy: () => undefined }),
        destroy: (withChildren = false) => {
            // Phaser containers cascade `destroy(true)` into their children.
            if (withChildren) {
                for (const child of object.children) child.destroy(true)
                object.children = []
            }
            object.destroyed = true
            return object
        },
        disableInteractive: () => {
            object.interactive = false
            return object
        },
        fillRect: () => object,
        fillRoundedRect: () => object,
        fillStyle: () => object,
        lineBetween: () => object,
        lineStyle: () => object,
        off: () => object,
        on: (event: string) => {
            object.listeners.push(event)
            return object
        },
        setDepth: (depth: number) => {
            object.depth = depth
            return object
        },
        setDisplaySize: (width: number, height: number) => {
            object.displayWidth = width
            object.displayHeight = height
            object.width = width
            object.height = height
            return object
        },
        setFillStyle: () => object,
        setInteractive: (config?: { hitArea?: { width: number; height: number } }) => {
            object.interactive = true
            if (config && typeof config === "object" && config.hitArea) object.hitArea = config.hitArea
            return object
        },
        setMask: (mask: unknown) => {
            object.masks = mask ? [mask] : []
            return object
        },
        setOrigin: () => object,
        setPosition: (nextX: number, nextY: number) => {
            object.x = nextX
            object.y = nextY
            return object
        },
        setRotation: () => object,
        setScale: (scale: number) => {
            object.scale = scale
            object.scaleX = scale
            return object
        },
        setSize: (width: number, height: number) => {
            object.width = width
            object.height = height
            return object
        },
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

interface FakeItem {
    id: string
    key: string
    sprite: FakeGameObject
    border: FakeGameObject
    stored: boolean
    slotPosition?: { x: number; y: number; maxSize: number; depth: number }
}

function fakeItem(key: string, index: number): FakeItem {
    const item: FakeItem = {
        id: `${key}-${index}`,
        key,
        sprite: fakeGameObject("image"),
        border: fakeGameObject("rectangle"),
        stored: false,
    }

    item.sprite.textureKey = `texture-${key}`
    item.sprite.texture = { key: `texture-${key}` }

    return Object.assign(item, {
        store: () => {
            item.stored = true
            item.slotPosition = undefined
        },
        showInSlot: (x: number, y: number, maxSize: number, depth: number) => {
            item.stored = false
            item.slotPosition = { x, y, maxSize, depth }
        },
    })
}

interface FakeTween {
    targets: unknown
    x: number
    y: number
    scale: number
    stopped: boolean
    complete(): void
}

function createSceneDouble() {
    const created: FakeGameObject[] = []
    const tweens: FakeTween[] = []
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
                object.texture = { key }
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
        make: { graphics: () => track(fakeGameObject("graphics")) },
        tweens: {
            add: (config: { targets: FakeGameObject; x: number; y: number; scale: number; onComplete?: () => void }): FakeTween => {
                const tween: FakeTween = {
                    targets: config.targets,
                    x: config.x,
                    y: config.y,
                    scale: config.scale,
                    stopped: false,
                    // A real tween only moves its target over time, so the end state is
                    // applied here instead of when the tween is created.
                    complete: () => {
                        if (tween.stopped) return

                        config.targets.x = config.x
                        config.targets.y = config.y
                        config.targets.scale = config.scale
                        config.onComplete?.()
                    },
                }

                tweens.push(tween)
                return tween
            },
            killTweensOf: (target: unknown) => {
                for (const tween of tweens) {
                    if (tween.targets === target) tween.stopped = true
                }
            },
        },
        input: {
            dragDistanceThreshold: 0,
            setDraggable: () => undefined,
            on: () => undefined,
            off: () => undefined,
        },
    }

    return { scene: scene as unknown as Game, created, tweens }
}

function createInventoryDouble(items: FakeItem[]) {
    const grouped = { artifact: [] as FakeItem[], completed: [] as FakeItem[], component: [] as FakeItem[] }

    for (const item of items) grouped.component.push(item)

    return {
        size: items.length,
        snapshot: () => ({ artifact: [...grouped.artifact], completed: [...grouped.completed], component: [...grouped.component] }),
        categoryOf: () => "component",
        reorder: () => undefined,
        has: (item: FakeItem) => items.includes(item),
        findById: (id: string) => items.find((item) => item.id === id),
        [Symbol.iterator]: () => items[Symbol.iterator](),
    } as unknown as ItemInventory
}

function bagSprite(created: FakeGameObject[]) {
    const sprite = created.find((object) => object.kind === "image")
    if (!sprite) throw new Error("InventoryBag did not create its bag sprite")

    return sprite
}

function blocker(created: FakeGameObject[]) {
    const rect = created.find((object) => object.kind === "rectangle")
    if (!rect) throw new Error("InventoryBag did not create its scroll surface")

    return rect
}

function scrollThumb(created: FakeGameObject[]) {
    const rects = created.filter((object) => object.kind === "rectangle")
    const thumb = rects[rects.length - 1]
    if (!thumb) throw new Error("InventoryBag did not create its scrollbar thumb")

    return thumb
}

function contentContainer(created: FakeGameObject[]) {
    const containers = created.filter((object) => object.kind === "container")
    const content = containers[containers.length - 1]
    if (!content) throw new Error("InventoryBag did not create its content container")

    return content
}

describe("InventoryBag initialization", () => {
    it("builds the bag before reading any sprite measurement", () => {
        const { scene, created } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble([]))

        const sprite = bagSprite(created)
        expect(sprite.textureKey).toBe("inventory-bag")
        expect(sprite.displayWidth).toBeGreaterThan(0)
        expect(sprite.displayHeight).toBeGreaterThan(0)

        bag.dispose()
    })

    it("anchors the icon to the top-right corner of the arena", () => {
        const { scene, created } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble([]))
        const sprite = bagSprite(created)

        const right = REGION.x + REGION.width
        const top = REGION.y
        const box = {
            left: sprite.x - sprite.displayWidth / 2,
            right: sprite.x + sprite.displayWidth / 2,
            top: sprite.y - sprite.displayHeight / 2,
            bottom: sprite.y + sprite.displayHeight / 2,
        }

        expect(box.right).toBeLessThanOrEqual(right)
        expect(box.top).toBeGreaterThanOrEqual(top)
        expect(right - box.right).toBeLessThan(VIEWPORT.width / 4)
        expect(box.top - top).toBeLessThan(VIEWPORT.height / 4)
        expect(right - box.right).toBeLessThan(box.left - REGION.x)

        bag.dispose()
    })

    it("opens, closes and reopens the panel without throwing", () => {
        const { scene } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble([]))

        expect(() => bag.open()).not.toThrow()
        expect(() => bag.close()).not.toThrow()
        expect(() => bag.open()).not.toThrow()
        expect(() => bag.toggle()).not.toThrow()

        bag.dispose()
    })

    it("destroys its Phaser objects on dispose", () => {
        const { scene, created } = createSceneDouble()
        const bag = new InventoryBag(scene, createInventoryDouble([]))

        bag.dispose()

        expect(bagSprite(created).destroyed).toBe(true)
        expect(contentContainer(created).destroyed).toBe(true)
    })
})

describe("InventoryBag fly-in animation", () => {
    const from = { x: REGION.x + 20, y: REGION.y + REGION.height - 20 }

    function flights(created: FakeGameObject[]) {
        return created.filter((object) => object.kind === "image" && object.textureKey !== "inventory-bag")
    }

    it("flies a deposited item from its origin and lands it in a slot", () => {
        const { scene, created, tweens } = createSceneDouble()
        const items = [fakeItem("component", 0)]
        const bag = new InventoryBag(scene, createInventoryDouble(items))

        bag.open()
        expect(items[0].slotPosition).toBeDefined()

        EventBus.emit("inventory-deposit", { item: items[0], from })

        const flight = flights(created)[0]
        expect(flight).toBeDefined()
        expect(flight.textureKey).toBe("texture-component")
        expect(flight.x).toBe(from.x)
        expect(flight.y).toBe(from.y)
        expect(flight.depth).toBe(ITEM_FLY_DEPTH)
        expect(flight.interactive).toBe(false)

        // While the copy flies, the item stays hidden and out of the grid: no duplicate.
        expect(items[0].stored).toBe(true)
        expect(items[0].slotPosition).toBeUndefined()

        const tween = tweens[tweens.length - 1]
        expect(tween.targets).toBe(flight)
        expect(tween.x).toBe(bagSprite(created).x)
        expect(tween.y).toBe(bagSprite(created).y)
        expect(tween.scale).toBeLessThan(flight.scale + 0.001)

        tween.complete()

        expect(flight.destroyed).toBe(true)
        expect(items[0].stored).toBe(false)
        expect(items[0].slotPosition).toBeDefined()

        bag.dispose()
    })

    it("ignores a repeated deposit while the item is still flying", () => {
        const { scene, created } = createSceneDouble()
        const items = [fakeItem("component", 0)]
        const bag = new InventoryBag(scene, createInventoryDouble(items))

        bag.open()
        EventBus.emit("inventory-deposit", { item: items[0], from })
        EventBus.emit("inventory-deposit", { item: items[0], from: { x: 1, y: 1 } })

        expect(flights(created)).toHaveLength(1)

        bag.dispose()
    })

    it("drops in-flight copies when the run is reset", () => {
        const { scene, created, tweens } = createSceneDouble()
        const items = [fakeItem("component", 0)]
        const bag = new InventoryBag(scene, createInventoryDouble(items))

        bag.open()
        EventBus.emit("inventory-deposit", { item: items[0], from })
        const flight = flights(created)[0]

        bag.cancelFlights()

        expect(flight.destroyed).toBe(true)
        expect(tweens[tweens.length - 1].stopped).toBe(true)
        expect(items[0].stored).toBe(true)

        bag.dispose()
    })

    it("destroys in-flight copies on dispose", () => {
        const { scene, created, tweens } = createSceneDouble()
        const items = [fakeItem("component", 0)]
        const bag = new InventoryBag(scene, createInventoryDouble(items))

        bag.open()
        EventBus.emit("inventory-deposit", { item: items[0], from })
        const flight = flights(created)[0]

        bag.dispose()

        expect(flight.destroyed).toBe(true)
        expect(tweens[tweens.length - 1].stopped).toBe(true)
    })
})

describe("InventoryBag grid growth", () => {
    it("grows the panel with the content and caps the width at five columns", () => {
        const widths: number[] = []

        for (const count of [1, 3, 5, 6, 16]) {
            const { scene, created } = createSceneDouble()
            const items = Array.from({ length: count }, (_value, index) => fakeItem("component", index))
            const bag = new InventoryBag(scene, createInventoryDouble(items))

            bag.open()
            widths.push(blocker(created).width)
            // The scroll surface must follow the panel: Phaser captures the hit area
            // when `setInteractive` runs, so a stale geom would kill panel gestures.
            expect(blocker(created).hitArea?.width).toBe(blocker(created).width)
            expect(blocker(created).hitArea?.height).toBe(blocker(created).height)
            bag.dispose()
        }

        for (let index = 1; index < widths.length; index++) {
            expect(widths[index]).toBeGreaterThanOrEqual(widths[index - 1])
        }

        expect(widths[2]).toBeGreaterThan(widths[0])
        // Five columns need 5 * 46 + 4 * 6 of grid, but the panel never grows past it.
        expect(widths[3]).toBe(widths[2])
        expect(widths[4]).toBe(widths[2])
    })

    it("keeps three rows of height and scrolls the rest", () => {
        const { scene, created } = createSceneDouble()
        const items = Array.from({ length: 16 }, (_value, index) => fakeItem("component", index))
        const bag = new InventoryBag(scene, createInventoryDouble(items))

        bag.open()
        const before = blocker(created).height
        const shownBefore = items.filter((item) => !item.stored).length

        // Rows 4 do not fit the three-row window, so the last item stays hidden.
        expect(shownBefore).toBe(15)
        expect(scrollThumb(created).visible).toBe(true)

        bag.scrollBy(VIEWPORT.height)
        expect(blocker(created).height).toBe(before)
        expect(items.filter((item) => item.stored).length).toBe(5)
        expect(items[0].stored).toBe(true)

        bag.scrollBy(-VIEWPORT.height)
        expect(items.filter((item) => item.stored).length).toBe(1)
        expect(items[0].stored).toBe(false)

        bag.dispose()
    })

    it("hides the scrollbar when everything fits", () => {
        const { scene, created } = createSceneDouble()
        const items = Array.from({ length: 3 }, (_value, index) => fakeItem("component", index))
        const bag = new InventoryBag(scene, createInventoryDouble(items))

        bag.open()

        expect(scrollThumb(created).visible).toBe(false)
        expect(items.every((item) => !item.stored)).toBe(true)

        bag.dispose()
    })

    it("hides every item while the panel is closed", () => {
        const { scene } = createSceneDouble()
        const items = Array.from({ length: 4 }, (_value, index) => fakeItem("component", index))
        const bag = new InventoryBag(scene, createInventoryDouble(items))

        bag.open()
        bag.close()

        expect(items.every((item) => item.stored)).toBe(true)

        bag.dispose()
    })
})

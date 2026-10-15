import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { depositOrigin } from "../../src/game/systems/Items/ItemDeposit"

const root = process.cwd()

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

describe("deposit context", () => {
    it("has no origin when the transfer carries no context", () => {
        expect(depositOrigin(undefined)).toBeUndefined()
    })

    it("has no origin when the caller asked for a silent store", () => {
        expect(depositOrigin({ animate: false })).toBeUndefined()
        expect(depositOrigin({ from: { x: 10, y: 20 }, animate: false })).toBeUndefined()
    })

    it("has no origin when there is nowhere to fly from", () => {
        expect(depositOrigin({})).toBeUndefined()
    })

    it("returns the world point the item flies from", () => {
        expect(depositOrigin({ from: { x: 12, y: 34 } })).toEqual({ x: 12, y: 34 })
        expect(depositOrigin({ from: { x: 0, y: 0 } })).toEqual({ x: 0, y: 0 })
    })
})

describe("backpack deposit wiring", () => {
    it("emits the deposit event before the group update", () => {
        const source = readSource(join(root, "src/game/systems/Items/ItemInventory.ts"))

        expect(source).toContain('EventBus.emit("inventory-deposit", { item, from })')
        expect(source).toContain("const from = depositOrigin(deposit)")
        expect(source.indexOf('EventBus.emit("inventory-deposit"')).toBeLessThan(source.indexOf("this.emit()"))
    })

    it("animates every transfer that knows where the item came from", () => {
        const game = readSource(join(root, "src/game/scenes/Game.ts"))
        const character = readSource(join(root, "src/game/creature/character/Character.ts"))
        const sorita = readSource(join(root, "src/game/creature/classes/Sorita.ts"))
        const anvil = readSource(join(root, "src/ui/ItemAnvilModal/ItemAnvilModal.tsx"))

        // Rewards, the anvil and Sorita's loot use the scene helper.
        expect(game).toContain("addItemToBag(item")
        expect(game).toContain("private rewardDeposit(")
        expect(anvil).toContain("props.game.addItemToBag(item)")
        expect(sorita).toContain("this.scene.addItemToBag(item, { from:")
        // Unequip/reject paths fly in from the character itself.
        expect(character).toContain("private characterDeposit(): ItemDeposit")
        expect(character).toContain("return { from: { x: this.x, y: this.y } }")
    })

    it("keeps save hydration and merged components silent", () => {
        const game = readSource(join(root, "src/game/scenes/Game.ts"))
        const creature = readSource(join(root, "src/game/creature/Creature.ts"))
        const hydration = game.slice(game.indexOf("progress.availableItems?.forEach"))

        // Hydration restores state, it never replays animations.
        expect(hydration).toContain("this.availableItems.add(ItemRegistry.create(item, this))")
        expect(hydration).not.toContain("addItemToBag")
        // A component consumed by a merge must not fly into the bag.
        expect(creature).toContain('this.unequipItem(result.component, false, { animate: false })')
    })

    it("stores items immediately when the gesture ended on the backpack", () => {
        const item = readSource(join(root, "src/game/systems/Items/Item.ts"))

        expect(item).toContain("const droppedOnBag = this.scene.inventoryBag?.blocksPoint(pointer.worldX, pointer.worldY) ?? false")
        expect(item).toContain("const deposit: ItemDeposit = droppedOnBag ? { animate: false } : { from: { x: this.sprite.x, y: this.sprite.y } }")
        expect(item).toContain("this.user?.unequipItem(this, false, deposit)")
    })

    it("resets in-flight items when the run is reset", () => {
        const game = readSource(join(root, "src/game/scenes/Game.ts"))
        const bag = readSource(join(root, "src/game/ui/InventoryBag.ts"))

        expect(game).toContain("this.inventoryBag?.cancelFlights()")
        expect(bag).toContain("cancelFlights()")
        expect(existsSync(join(root, "src/game/systems/Items/ItemDeposit.ts"))).toBe(true)
    })
})

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const contextPath = join(root, "aicontext/game-creature-groups.md")
const creatureGroupPath = join(root, "src/game/creature/CreatureGroup.ts")
const playerTeamPath = join(root, "src/game/creature/character/PlayerTeam.ts")
const enemyTeamPath = join(root, "src/game/creature/monsters/EnemyTeam.ts")
const characterPath = join(root, "src/game/creature/character/Character.ts")
const benchPath = join(root, "src/game/creature/character/Bench.ts")
const characterStorePath = join(root, "src/game/creature/character/CharacterStore.ts")

function readSource(path: string) {
    return readFileSync(path, "utf8")
}

describe("creature group aicontext", () => {
    it("documents group systems without numeric balance values", () => {
        const context = readSource(contextPath)

        for (const heading of [
            "### CreatureGroup",
            "### PlayerTeam",
            "### EnemyTeam",
            "### Character",
            "### Bench",
            "### CharacterStore",
        ]) {
            expect(context).toContain(heading)
        }

        expect(context).toContain("localStorage")
        expect(context).toContain("EventBus")
        expect(context).toContain("DTO")
        expect(context).toContain("idle")
        expect(context).toContain("fighting")
        expect(context).not.toMatch(/[0-9]/)
        expect(context).not.toContain("%")
    })
})

describe("CreatureGroup contracts", () => {
    it("manages children, optional minions, augments, and auras", () => {
        const source = readSource(creatureGroupPath)

        expect(source).toContain("export class CreatureGroup extends Phaser.GameObjects.Group")
        expect(source).toContain("scene.add.existing(this)")
        expect(source).toContain("this.runChildUpdate = true")
        expect(source).toContain("this.augments = new Set()")
        expect(source).toContain("this.minions = new CreatureGroup(scene)")
        expect(source).toContain("override getChildren(minions = false, activeOnly = false)")
        expect(source).toContain("...this.minions.getChildren()")
        expect(source).toContain("list.filter((item) => item.active)")
        expect(source).toContain("override add(child: Creature")
        expect(source).toContain("child.team = this")
    })

    it("resets, clears UI and item sprites, and exposes board lookup helpers", () => {
        const source = readSource(creatureGroupPath)

        expect(source).toContain("reset()")
        expect(source).toContain("creature.reset()")
        expect(source).toContain("this.refreshAllStats()")
        expect(source).toContain("this.minions.clear(true, true)")
        expect(source).toContain("refreshAllStats()")
        expect(source).toContain("c.refreshStats()")
        expect(source).toContain("override clear")
        expect(source).toContain("creature.destroyUi()")
        expect(source).toContain("item.sprite.destroy(true)")
        expect(source).toContain("getCreatureInPosition")
        expect(source).toContain("getCreatureInCell")
        expect(source).toContain("this.scene.grid.worldToCell")
        expect(source).toContain("isWiped()")
    })

    it("adds augments and removes auras with cleanup", () => {
        const source = readSource(creatureGroupPath)

        expect(source).toContain("addAugment(augment: Augment)")
        expect(source).toContain("augment.chosenFloor = this.scene.floor")
        expect(source).toContain("this.augments.add(augment)")
        expect(source).toContain("creature.glowTemporarily")
        expect(source).toContain("this.reset()")
        expect(source).toContain("this.scene.saveProgress()")
        expect(source).toContain("getLowestHealth")
        expect(source).toContain("creature.health / creature.maxHealth")
        expect(source).toContain("addAura(aura: Aura)")
        expect(source).toContain("removeAura(aura: Aura)")
        expect(source).toContain("aura.cleanup(creature)")
        expect(source).toContain("this.auras.delete(aura)")
    })
})

describe("PlayerTeam contracts", () => {
    it("constructs player-only systems and typed children", () => {
        const source = readSource(playerTeamPath)

        expect(source).toContain("export class PlayerTeam extends CreatureGroup")
        expect(source).toContain("this.damageChart = new DamageChart(this)")
        expect(source).toContain("this.bench = new Bench(this)")
        expect(source).toContain("this.store = new CharacterStore(this)")
        expect(source).toContain("override getChildren")
        expect(source).toContain("as Character[]")
        expect(source).toContain("getById(id: string)")
    })

    it("resets invalid board state, traits, and UI emissions", () => {
        const source = readSource(playerTeamPath)

        expect(source).toContain("reset()")
        expect(source).toContain("super.reset()")
        expect(source).toContain("this.deleteFuckedUpCharacter()")
        expect(source).toContain("this.resetTraits()")
        expect(source).toContain("this.emitArray()")
        expect(source).toContain("deleteFuckedUpCharacter()")
        expect(source).toContain("grid.worldToCell")
        expect(source).toContain("grid.cellToCenter")
        expect(source).toContain("this.saveAndEmit()")
    })

    it("adds characters through saved positions or player grid placement", () => {
        const source = readSource(playerTeamPath)

        expect(source).toContain("add(child: Character")
        expect(source).toContain("child.boardX !== 0 && child.boardY !== 0")
        expect(source).toContain("child.reset()")
        expect(source).toContain("this.resetTraits()")
        expect(source).toContain("this.refreshAllStats()")
        expect(source).toContain("const grid = this.scene.grid")
        expect(source).toContain("child.setPosition(x, y)")
        expect(source).toContain("child.body?.reset(x, y)")
        expect(source).toContain("this.tryMerge(child)")
        expect(source).toContain("this.saveAndEmit()")
    })

    it("merges only outside combat and persists the resulting board", () => {
        const source = readSource(playerTeamPath)

        expect(source).toContain("tryMerge(pivot: Character)")
        expect(source).toContain("if (this.scene.state === \"fighting\") return")
        expect(source).toContain("this.getMatchingCharacters(name, level)")
        expect(source).toContain("this.mergeTriplet")
        expect(source).toContain("disableInteractive")
        expect(source).toContain("scene.input.setDraggable")
        expect(source).toContain("donor.unequipItem(item)")
        expect(source).toContain("item.drop()")
        expect(source).toContain("donor.destroy(true)")
        expect(source).toContain("keep.levelUp()")
        expect(source).toContain("this.saveAndEmit()")
    })

    it("saves, augments, benches, and recalculates traits through EventBus", () => {
        const source = readSource(playerTeamPath)

        expect(source).toContain("saveCurrentCharacters()")
        expect(source).toContain("this.scene.savePlayerCharacters(characters.map((char) => char.getDto()))")
        expect(source).toContain("emitArray()")
        expect(source).toContain("EventBus.emit(\"characters-change\"")
        expect(source).toContain("override addAugment")
        expect(source).toContain("augment.onPick(this)")
        expect(source).toContain("EventBus.emit(\"augments-add\"")
        expect(source).toContain("emitAugments()")
        expect(source).toContain("benchCharacter(id: string)")
        expect(source).toContain("this.bench.add(dto)")
        expect(source).toContain("isBoardFull()")
        expect(source).toContain("resetTraits()")
        expect(source).toContain("TraitsRegistry.compTraits")
        expect(source).toContain("trait.startApplying(characters)")
        expect(source).toContain("EventBus.emit(\"active-traits\"")
    })
})

describe("EnemyTeam contracts", () => {
    it("positions monsters, applies enemy augments, and snaps items", () => {
        const source = readSource(enemyTeamPath)

        expect(source).toContain("export class EnemyTeam extends CreatureGroup")
        expect(source).toContain("override getChildren")
        expect(source).toContain("as Monster[]")
        expect(source).toContain("reset()")
        expect(source).toContain("super.reset()")
        expect(source).toContain("this.replaceInBoard()")
        expect(source).toContain("this.snapItems()")
        expect(source).toContain("replaceInBoard()")
        expect(source).toContain("preferredPosition")
        expect(source).toContain("front")
        expect(source).toContain("middle")
        expect(source).toContain("back")
        expect(source).toContain("monster.body.reset(x, y)")
        expect(source).toContain("override addAugment")
        expect(source).toContain("augment.onPick(this)")
        expect(source).toContain("EventBus.emit(\"enemies-augments-add\"")
        expect(source).toContain("emitAugments()")
        expect(source).toContain("EventBus.emit(\"enemies-augments-change\"")
        expect(source).toContain("item.snapToCreature(monster)")
    })
})

describe("Character contracts", () => {
    it("extends Creature with level badge, board coordinates, DTO loading, and trait reapplication", () => {
        const source = readSource(characterPath)

        expect(source).toContain("export interface CharacterDto")
        expect(source).toContain("export class Character extends Creature")
        expect(source).toContain("this.levelBadge = new LevelBadge")
        expect(source).toContain("this.boardX = boardX || 0")
        expect(source).toContain("this.handleMouseEvents()")
        expect(source).toContain("override refreshStats()")
        expect(source).toContain("super.reset()")
        expect(source).toContain("this.applyItems()")
        expect(source).toContain("this.reapplyTraits()")
        expect(source).toContain("this.applyAugments()")
        expect(source).toContain("this.applyAuras()")
        expect(source).toContain("loadFromDto(dto: CharacterDto)")
        expect(source).toContain("ItemRegistry.create(entry, this.scene)")
        expect(source).toContain("this.onPlacementChange()")
        expect(source).toContain("trait.tryApply(this)")
    })

    it("handles idle-only drag, bridge events, global listener cleanup, and board snapping", () => {
        const source = readSource(characterPath)

        expect(source).toContain("handleMouseEvents(): void")
        expect(source).toContain("this.scene.input.setDraggable(this)")
        expect(source).toContain("if (this.scene.state !== \"idle\") return")
        expect(source).toContain("this.scene.grid.showDropOverlay()")
        expect(source).toContain("this.scene.shopkeeper.onCharacterDragGlow(true)")
        expect(source).toContain("this.scene.tavern.onCharacterDragGlow(true)")
        expect(source).toContain("const ctrl = new AbortController()")
        expect(source).toContain("window.addEventListener(\"pointermove\"")
        expect(source).toContain("window.addEventListener(\"pointerup\"")
        expect(source).toContain("document.addEventListener")
        expect(source).toContain("EventBus.emit(\"ph-drag-start\"")
        expect(source).toContain("EventBus.emit(\"ph-drag-end\"")
        expect(source).toContain("this.globalDragCtrl?.abort()")
        expect(source).toContain("this.scene.grid.snapCharacter")
        expect(source).toContain("this.team.saveCurrentCharacters()")
        expect(source).toContain("this.once(\"destroy\"")
    })

    it("serializes, levels, updates UI, and persists item equip changes", () => {
        const source = readSource(characterPath)

        expect(source).toContain("override die()")
        expect(source).toContain("this.levelBadge.fadeOut()")
        expect(source).toContain("override destroyUi")
        expect(source).toContain("this.levelBadge.destroy()")
        expect(source).toContain("emitSelf()")
        expect(source).toContain("EventBus.emit(`character-${this.id}-update`, this)")
        expect(source).toContain("levelUp()")
        expect(source).toContain("this.levelBadge.setValue(this.level)")
        expect(source).toContain("levelUpTo(quantity: number)")
        expect(source).toContain("updateCharUi()")
        expect(source).toContain("this.levelBadge.updatePosition()")
        expect(source).toContain("getDto()")
        expect(source).toContain("items: Array.from(this.items.values()).map((item) => item.key)")
        expect(source).toContain("override equipItem")
        expect(source).toContain("this.scene.availableItems.delete(item)")
        expect(source).toContain("this.team.saveCurrentCharacters()")
        expect(source).toContain("this.scene.saveProgress()")
        expect(source).toContain("override unequipItem")
        expect(source).toContain("this.scene.availableItems.add(item)")
        expect(source).toContain("onBenchDrop()")
        expect(source).toContain("item.dropOnBoard()")
        expect(source).toContain("this.team.resetTraits()")
        expect(source).toContain("override destroy")
    })
})

describe("Bench contracts", () => {
    it("persists bench DTOs through localStorage and EventBus", () => {
        const source = readSource(benchPath)

        expect(source).toContain("export class Bench")
        expect(source).toContain("characters: CharacterDto[] = []")
        expect(source).toContain("this.load()")
        expect(source).toContain("isFull()")
        expect(source).toContain("getCharacter(id: string)")
        expect(source).toContain("EventBus.emit(\"character-bench\"")
        expect(source).toContain("localStorage.setItem(\"bench\"")
        expect(source).toContain("localStorage.getItem(\"bench\")")
        expect(source).toContain("this.characters = JSON.parse(data)")
        expect(source).toContain("clear()")
        expect(source).toContain("this.characters = []")
    })

    it("adds, summons, sells, and detects level-up candidates across bench and board", () => {
        const source = readSource(benchPath)

        expect(source).toContain("add(dto: CharacterDto)")
        expect(source).toContain("this.wouldLevelUp(name, level, dto.id)")
        expect(source).toContain("this.characters.push(dto)")
        expect(source).toContain("matchingCharsInBoard.length > 0")
        expect(source).toContain("this.summon(dto.id, true)")
        expect(source).toContain("CharacterRegistry.create(name, this.scene, dto.id)")
        expect(source).toContain("character.levelUpTo(dto.level)")
        expect(source).toContain("character.levelUp()")
        expect(source).toContain("remove(id: string)")
        expect(source).toContain("summon(id: string")
        expect(source).toContain("CharacterRegistry.load(dto, this.scene)")
        expect(source).toContain("this.team.add(character)")
        expect(source).toContain("EventBus.emit(\"select-char\"")
        expect(source).toContain("sell(id: string)")
        expect(source).toContain("this.team.store.getCost(dto.level)")
        expect(source).toContain("this.scene.changePlayerGold")
        expect(source).toContain("getMatchingCharacter")
        expect(source).toContain("wouldLevelUp")
        expect(source).toContain("this.team.getMatchingCharacters(name, level)")
        expect(source).toContain("getHighestLevelChar()")
    })
})

describe("CharacterStore contracts", () => {
    it("loads, shuffles, persists, and emits store state", () => {
        const source = readSource(characterStorePath)

        expect(source).toContain("export interface StoreItem")
        expect(source).toContain("export class CharacterStore")
        expect(source).toContain("this.load()")
        expect(source).toContain("this.shuffle()")
        expect(source).toContain("shuffle(free = true)")
        expect(source).toContain("this.items = []")
        expect(source).toContain("this.team.getHighestLevelChar()")
        expect(source).toContain("this.team.bench.getHighestLevelChar()")
        expect(source).toContain("CharacterRegistry.random(this.scene)")
        expect(source).toContain("RNG.characterLevel(highestPossibleLevel)")
        expect(source).toContain("character.getDto()")
        expect(source).toContain("character.destroy(true)")
        expect(source).toContain("EventBus.emit(\"character-store\"")
        expect(source).toContain("localStorage.setItem(\"store\"")
        expect(source).toContain("localStorage.getItem(\"store\")")
    })

    it("buys, sells, prices, and finds matching unsold offers", () => {
        const source = readSource(characterStorePath)

        expect(source).toContain("buy(item: StoreItem)")
        expect(source).toContain("if (item.sold) return")
        expect(source).toContain("this.scene.changePlayerGold(this.scene.playerGold - item.cost)")
        expect(source).toContain("item.sold = true")
        expect(source).toContain("this.team.bench.add(item.character)")
        expect(source).toContain("this.scene.state === \"idle\"")
        expect(source).toContain("this.team.bench.summon(item.character.id)")
        expect(source).toContain("getCost(level: number)")
        expect(source).toContain("sellFromId(id: string)")
        expect(source).toContain("sell(character: Character)")
        expect(source).toContain("this.scene.changePlayerGold(this.scene.playerGold + refund)")
        expect(source).toContain("character.destroy(true)")
        expect(source).toContain("this.team.reset()")
        expect(source).toContain("this.team.bench.remove(character.id)")
        expect(source).toContain("this.scene.savePlayerCharacters")
        expect(source).toContain("getMatchingCharacter(item: StoreItem)")
        expect(source).toContain("potentialItem.sold || potentialItem === item")
    })
})

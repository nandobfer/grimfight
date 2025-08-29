import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { RNG } from "../../tools/RNG"
import { CharacterRegistry } from "../CharacterRegistry"
import { Character, CharacterDto } from "./Character"
import { CharacterGroup } from "./CharacterGroup"

const MAX_ITEMS_IN_STORE = 5

export interface StoreItem {
    character: CharacterDto
    cost: number
    sold: boolean
}

const BASE_COST = 1

export class CharacterStore {
    team: CharacterGroup
    items: StoreItem[] = []
    scene: Game

    constructor(team: CharacterGroup) {
        this.team = team
        this.scene = team.scene
        this.load()

        if (this.items.length === 0) {
            this.shuffle()
        }
    }

    shuffle(free = true) {
        this.items = []
        const highestPossibleLevel = Math.max(1, this.team.getHighestLevelChar(), this.team.bench.getHighestLevelChar())

        for (let index = 1; index <= MAX_ITEMS_IN_STORE; index++) {
            const character = CharacterRegistry.random(this.scene)
            const targetLevel = RNG.characterLevel(highestPossibleLevel)
            character.levelUpTo(targetLevel)

            if (character.level === 1) {
                character.calculateStats()
            }
            const dto = character.getDto()
            this.items.push({ character: dto, cost: this.getCost(dto.level), sold: false })
            character.destroy(true)
        }

        if (!free) {
            this.scene.changePlayerGold(this.scene.playerGold - 2)
        }

        EventBus.emit("character-store", this.items)
        this.save()
    }

    save() {
        try {
            localStorage.setItem("store", JSON.stringify(this.items))
        } catch (error) {
            console.error("Error saving store:", error)
        }
    }

    load() {
        try {
            const data = localStorage.getItem("store")
            if (data) {
                this.items = JSON.parse(data)
            }
        } catch (error) {
            console.error("Error loading saved store:", error)
        }
    }

    buy(item: StoreItem, recurrentBuy = false) {
        const name = item.character.name
        const level = item.character.level
        const { matchingCharsInBench, matchingCharsInBoard } = this.team.bench.wouldLevelUp(name, level, item.character.id)

        const already = matchingCharsInBench.length + (this.scene.state === "fighting" ? 0 : matchingCharsInBoard.length)
        const withThis = already + 1

        // other matching items available in the store (excluding this one and sold ones)
        const matchingInStore: StoreItem[] = this.getMatchingCharacter(item)
            .filter((i) => i !== item && !i.sold)
            .sort((a, b) => a.cost - b.cost)

        // Decide if we must chain-buy to make an immediate merge
        let mustChain = false
        let nextToBuy: StoreItem[] = []

        if (this.team.bench.isFull()) {
            if (withThis >= 3) {
                // Buying this alone will complete a triplet → allowed
                mustChain = false
            } else {
                // Need extra copies from the store to reach 3 right now
                const need = 3 - withThis
                if (matchingInStore.length < need) {
                    // Not enough matches in shop → block purchase
                    return
                }
                nextToBuy = matchingInStore.slice(0, need)
                const totalCost = item.cost + nextToBuy.reduce((s, it) => s + it.cost, 0)

                if (this.scene.playerGold < totalCost) {
                    // Can't afford the whole merge package → block purchase
                    return
                }
                mustChain = true
            }
        }

        this.scene.changePlayerGold(this.scene.playerGold - item.cost)
        item.sold = true
        this.team.bench.add(item.character)

        if (!recurrentBuy && mustChain) {
            for (const next of nextToBuy) {
                // Each is guaranteed affordable and available by the pre-checks above
                this.buy(next, true)
            }
        }

        // persist after the whole operation
        if (!recurrentBuy) this.save()
    }

    getCost(level: number) {
        return Math.max(BASE_COST, Math.pow(3, level - 1))
    }

    sellFromId(id: string) {
        const character = this.team.getById(id)
        if (character) {
            this.sell(character)
        }
    }

    sell(character: Character) {
        const refund = this.getCost(character.level)
        this.scene.changePlayerGold(this.scene.playerGold + refund)
        character.destroy(true)
        this.team.reset()
        this.team.bench.remove(character.id)
        this.scene.savePlayerCharacters(this.team.getChildren())
    }

    getMatchingCharacter(item: StoreItem) {
        const matchingCharsInStore: StoreItem[] = []

        for (const potentialItem of this.items) {
            if (potentialItem.sold || potentialItem === item) {
                continue
            }

            if (potentialItem.character.name === item.character.name && potentialItem.character.level === item.character.level) {
                matchingCharsInStore.push(potentialItem)
            }
        }

        return matchingCharsInStore
    }
}

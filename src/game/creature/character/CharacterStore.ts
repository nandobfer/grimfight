import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { RNG } from "../../tools/RNG"
import { CharacterRegistry } from "../CharacterRegistry"
import { CharacterDto } from "./Character"
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
        const highestPossibleLevel = Math.max(1, this.team.getHighestLevelChar())

        for (let index = 1; index <= MAX_ITEMS_IN_STORE; index++) {
            const character = CharacterRegistry.random(this.scene)
            const targetLevel = RNG.characterLevel(highestPossibleLevel)
            character.levelUpTo(targetLevel)

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
        const matchingCharsInBoard = this.team.getMatchingCharacters(name, level)
        const matchingCharsInStore: StoreItem[] = []
        let shouldBuyNextItems = false

        const wouldLevelUp = () => matchingCharsInBoard.length + matchingCharsInStore.length >= 2

        if (this.team.countActive() === this.scene.max_characters_in_board && !recurrentBuy) {
            for (const potentialItem of this.items) {
                if (potentialItem.sold || potentialItem === item) {
                    continue
                }

                if (potentialItem.character.name === name && potentialItem.character.level === level) {
                    matchingCharsInStore.push(potentialItem)
                    if (wouldLevelUp()) {
                        shouldBuyNextItems = true
                        break
                    }
                }
            }

            if (!wouldLevelUp()) {
                return
            }
        }

        const character = CharacterRegistry.create(name, this.scene, item.character.id)
        character.id = RNG.uuid()
        character.levelUpTo(item.character.level)
        this.team.add(character)
        this.scene.changePlayerGold(this.scene.playerGold - item.cost)
        item.sold = true

        if (!recurrentBuy) {
            if (shouldBuyNextItems) {
                for (const nextItem of matchingCharsInStore) {
                    this.buy(nextItem, true)
                }
            }
            this.save()
        }
    }

    getCost(level: number) {
        return Math.max(BASE_COST, Math.pow(3, level - 1))
    }

    sell(id: string) {
        const character = this.team.getById(id)
        if (character) {
            const refund = this.getCost(character.level)
            this.scene.changePlayerGold(this.scene.playerGold + refund)
            character.destroy(true)
            this.team.reset()
            this.scene.savePlayerCharacters(this.team.getChildren())
        }
    }
}

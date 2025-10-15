import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { RNG } from "../../tools/RNG"
import { CharacterRegistry } from "../CharacterRegistry"
import { Character, CharacterDto } from "./Character"
import { PlayerTeam } from "./PlayerTeam"

const MAX_ITEMS_IN_STORE = 5

export interface StoreItem {
    character: CharacterDto
    cost: number
    sold: boolean
}

const BASE_COST = 1

export class CharacterStore {
    team: PlayerTeam
    items: StoreItem[] = []
    scene: Game

    constructor(team: PlayerTeam) {
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

    buy(item: StoreItem) {
        if (item.sold) return

        this.scene.changePlayerGold(this.scene.playerGold - item.cost)
        item.sold = true
        this.team.bench.add(item.character)

        // auto summon if empty slot on the board
        if (this.team.getChildren(false, true).length < this.scene.max_characters_in_board && this.scene.state === "idle") {
            this.team.bench.summon(item.character.id)
        }
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
        this.scene.savePlayerCharacters(this.team.getChildren().map((char) => char.getDto()))
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

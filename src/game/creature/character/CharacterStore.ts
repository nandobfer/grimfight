import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { CharacterRegistry } from "../CharacterRegistry"
import { CharacterDto } from "./Character"
import { CharacterGroup } from "./CharacterGroup"

const MAX_ITEMS_IN_STORE = 5

export interface StoreItem {
    character: CharacterDto
    cost: number
}

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

    shuffle() {
        this.items = []

        for (let index = 1; index <= MAX_ITEMS_IN_STORE; index++) {
            const character = CharacterRegistry.random(this.scene)
            const dto = character.getDto()
            this.items.push({ character: dto, cost: dto.level * 3 })
            character.destroy(true)
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
        const character = CharacterRegistry.create(item.character.name, this.scene, item.character.id)
        this.team.add(character)
        this.scene.changePlayerGold(this.scene.playerGold - item.cost)
    }
}

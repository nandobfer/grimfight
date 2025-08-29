import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { RNG } from "../../tools/RNG"
import { CharacterRegistry } from "../CharacterRegistry"
import { CharacterDto } from "./Character"
import { CharacterGroup } from "./CharacterGroup"

export class Bench {
    team: CharacterGroup
    characters: CharacterDto[] = []
    scene: Game

    constructor(team: CharacterGroup) {
        this.team = team
        this.scene = team.scene
        this.load()
    }

    isFull() {
        return this.characters.length >= this.scene.max_bench_size
    }

    getCharacter(id: string) {
        return this.characters.find((character) => character.id === id)
    }

    emit() {
        EventBus.emit("character-bench", this.characters)
    }

    save() {
        try {
            localStorage.setItem("bench", JSON.stringify(this.characters))
            this.emit()
        } catch (error) {
            console.error("Error saving bench:", error)
        }
    }

    clear() {
        this.characters = []
        this.save()
    }

    load() {
        try {
            const data = localStorage.getItem("bench")
            if (data) {
                this.characters = JSON.parse(data)
                if (this.characters.length > this.scene.max_bench_size) {
                    this.characters.pop()
                }
            }
        } catch (error) {
            console.error("Error loading saved bench:", error)
        }
    }

    add(dto: CharacterDto) {
        const name = dto.name
        const level = dto.level

        const { matchingCharsInBench, matchingCharsInBoard, wouldLevelUp } = this.wouldLevelUp(name, level, dto.id)

        this.characters.push(dto)
        this.save()

        if (wouldLevelUp) {
            const shouldSummon = matchingCharsInBoard.length > 0

            if (shouldSummon) {
                matchingCharsInBench.forEach((item) => this.summon(item.id, true))
                this.summon(dto.id, true)
            } else {
                const donors = [...matchingCharsInBench, dto]
                donors.forEach((donor) => this.remove(donor.id))
                const character = CharacterRegistry.create(name, this.scene, dto.id)
                character.id = RNG.uuid()
                character.levelUpTo(dto.level)
                character.levelUp()
                this.add(character.getDto())
                character.destroy(true)
                this.save()
            }
        }
    }

    remove(id: string) {
        this.characters = [...this.characters.filter((item) => item.id !== id)]
        this.save()
    }

    summon(id: string, force = false) {
        const dto = this.getCharacter(id)
        if (dto && (this.team.countActive() < this.scene.max_characters_in_board || force)) {
            const character = CharacterRegistry.load(dto, this.scene)
            character.boardX = 0
            character.boardY = 0
            this.team.add(character)
            this.remove(id)
            EventBus.emit("select-char", character)
        }
    }

    sell(id: string) {
        const dto = this.getCharacter(id)
        if (dto) {
            const refund = this.team.store.getCost(dto.level)
            this.scene.changePlayerGold(this.scene.playerGold + refund)
            this.remove(id)
        }
    }

    getMatchingCharacter(name: string, level: number, id: string) {
        const matchingCharsInBench: CharacterDto[] = []

        for (const dto of this.characters) {
            if (dto.id === id) {
                continue
            }

            if (dto.name === name && dto.level === level) {
                matchingCharsInBench.push(dto)
            }
        }
        return matchingCharsInBench
    }

    wouldLevelUp(name: string, level: number, id: string) {
        const matchingCharsInBoard = this.team.getMatchingCharacters(name, level)
        const matchingCharsInBench = this.getMatchingCharacter(name, level, id)

        return { matchingCharsInBench, matchingCharsInBoard, wouldLevelUp: matchingCharsInBench.length + matchingCharsInBoard.length >= 2 }
    }

    getHighestLevelChar() {
        return this.characters.reduce((level, char) => (level > char.level ? level : char.level), 0)
    }

    drag(dto: CharacterDto) {
        const character = CharacterRegistry.load(dto, this.scene)
    }
}

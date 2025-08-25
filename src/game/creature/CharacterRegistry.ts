import { Game } from "../scenes/Game"
import { RNG } from "../tools/RNG"
import { Character } from "./character/Character"
import { Archer } from "./classes/Archer"
import { Knight } from "./classes/Knight"
import { Lizwan } from "./classes/Lizwan"
import { Mage } from "./classes/Mage"
import { Rogue } from "./classes/Rogue"
import { Sorcerer } from "./classes/Sorcerer"

// Create a character registry
export class CharacterRegistry {
    private static registry: Map<string, new (scene: Game, name: string, id: string, boardX?: number, boardY?: number) => Character> = new Map()

    static register(name: string, characterClass: new (scene: Game, name: string, id: string) => Character) {
        this.registry.set(name, characterClass)
    }

    static create(name: string, scene: Game, id: string, boardX?: number, boardY?: number): Character {
        const CharacterClass = this.registry.get(name)
        if (!CharacterClass) {
            throw new Error(`Character class not found: ${name}`)
        }
        const character = new CharacterClass(scene, id, id, boardX, boardY)
        return character
    }

    static getAllRegistered(): string[] {
        return Array.from(this.registry.keys())
    }

    static randomName() {
        return RNG.pick(this.getAllRegistered())
    }

    static random(scene: Game) {
        const name = this.randomName()
        const character = this.create(name, scene, RNG.uuid())
        return character
    }
}

CharacterRegistry.register("rogue", Rogue)
CharacterRegistry.register("knight", Knight)
CharacterRegistry.register("archer", Archer)
CharacterRegistry.register("mage", Mage)
CharacterRegistry.register("sorcerer", Sorcerer)
CharacterRegistry.register("lizwan", Lizwan)

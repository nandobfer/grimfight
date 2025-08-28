import { Game } from "../scenes/Game"
import { RNG } from "../tools/RNG"
import { Character, CharacterDto } from "./character/Character"
import { Archer } from "./classes/Archer"
import { Barbarian } from "./classes/Barbarian"
import { Knight } from "./classes/Knight"
import { Lizwan } from "./classes/Lizwan"
import { Mage } from "./classes/Mage"
import { Rogue } from "./classes/Rogue"
import { Sorcerer } from "./classes/Sorcerer"
import { Statikk } from "./classes/Statikk"
import { Necromancer } from "./classes/Necromancer"
import { Helyna } from "./classes/Druid"

// Create a character registry
export class CharacterRegistry {
    private static registry: Map<
        string,
        new (scene: Game, name: string, id: string, boardX?: number, boardY?: number, dataOnly?: boolean) => Character
    > = new Map()

    static register(name: string, characterClass: new (scene: Game, name: string, id: string) => Character) {
        this.registry.set(name, characterClass)
    }

    static create(name: string, scene: Game, id: string, boardX?: number, boardY?: number, dataOnly?: boolean): Character {
        const CharacterClass = this.registry.get(name)
        if (!CharacterClass) {
            throw new Error(`Character class not found: ${name}`)
        }
        const character = new CharacterClass(scene, id, id, boardX, boardY, dataOnly)
        return character
    }

    static load(dto: CharacterDto, scene: Game) {
        const character = CharacterRegistry.create(dto.name, scene, dto.id)
        character.id = dto.id
        character.levelUpTo(dto.level)
        return character
    }

    static getAllRegistered(): string[] {
        return Array.from(this.registry.keys())
    }

    static randomName() {
        return RNG.pick(this.getAllRegistered())
    }

    static random(scene: Game, dataOnly?: boolean) {
        const name = this.randomName()
        const character = this.create(name, scene, RNG.uuid(), undefined, undefined, dataOnly)
        return character
    }
}

CharacterRegistry.register("mordred", Rogue)
CharacterRegistry.register("maximus", Knight)
CharacterRegistry.register("laherce", Archer)
CharacterRegistry.register("megumin", Mage)
CharacterRegistry.register("jadis", Sorcerer)
CharacterRegistry.register("lizwan", Lizwan)
CharacterRegistry.register("zairon", Necromancer)
CharacterRegistry.register("grok", Barbarian)
CharacterRegistry.register("statikk", Statikk)
CharacterRegistry.register("helyna", Helyna)

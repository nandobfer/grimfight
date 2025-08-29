import { Character } from "../../creature/character/Character"

export class Trait {
    name: string
    description: string

    comp: string[]
    stages: Map<number, Record<string, any>> = new Map()
    charactersCount = 0
    activeStage = 0

    constructor(comp: string[]) {
        this.comp = comp
    }

    // each augment must override
    applyModifier(character: Character) {}

    startApplying(characters: Character[]) {
        const compCharacters: Character[] = []
        for (const character of characters) {
            if (this.comp.includes(character.name)) {
                this.charactersCount += 1
                compCharacters.push(character)
            }
        }

        this.getActiveStage()
        compCharacters.forEach((character) => this.applyModifier(character))
    }

    // each augment must override
    afterApplying(characters: Character[]) { }
    
    getActiveStage() {
        for (const [stage] of this.stages) {
            if (this.charactersCount >= stage) {
                this.activeStage = stage
            }
        }
    }
}

import { Character } from "../../creature/character/Character"

export class Trait {
    name: string
    description: string

    comp: string[]
    stages: Map<number, Record<string, any>> = new Map()
    charactersCount = 0
    activeStage = 0
    maxStage = 0

    constructor(comp: string[]) {
        this.comp = comp
    }

    // each augment must override
    setMaxStage() {
        for (const [stage] of this.stages) {
            if (stage > this.maxStage) {
                this.maxStage = stage
            }
        }
    }

    // each augment must override
    applyModifier(character: Character) {}

    startApplying(characters: Character[]) {
        const compCharacters = characters.filter((c) => this.comp.includes(c.name))
        const uniqueCharacters = new Set(compCharacters.map((c) => c.name))

        this.charactersCount = uniqueCharacters.size
        this.getActiveStage()
    }

    tryApply(character: Character) {
        if (this.comp.includes(character.name)) {
            this.cleanup(character)
            this.applyModifier(character)
        }
    }

    // each augment must override
    afterApplying(characters: Character[]) {}

    // each augment must override
    cleanup(character: Character) {}

    getActiveStage() {
        for (const [stage] of this.stages) {
            if (this.charactersCount >= stage) {
                this.activeStage = stage
            }
        }
    }
}

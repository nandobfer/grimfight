import type { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type ArcanistStage = {
    apMultiplier: number
    delay: number
    descriptionParams: string[]
}

export class ArcanistTrait extends Trait {
    name = "Arcanist"
    description = "Arcanists gain {0} AP every {1} seconds during combat."
    stages: Map<number, ArcanistStage> = new Map([
        [2, { apMultiplier: 0.07, delay: 4000, descriptionParams: ["7%", "4"] }],
        [4, { apMultiplier: 0.07, delay: 2000, descriptionParams: ["7%", "2"] }],
        [6, { apMultiplier: 0.07, delay: 1000, descriptionParams: ["7%", "1"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.timeEvents.arcanistTrait
        if (previousHandler) {
            character.scene.time.removeEvent(previousHandler)
        }

        const buff = () => {
            if (character.scene.state === "fighting") {
                character.abilityPower += character.baseAbilityPower * values.apMultiplier
            }
        }

        character.timeEvents.arcanistTrait = character.scene.time.addEvent({ callback: buff, loop: true, delay: values.delay })

        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character): void {
        const handler = character.timeEvents.arcanistTrait
        if (handler) {
            character.scene.time.removeEvent(handler)
            delete character.timeEvents.arcanistTrait
        }
    }
}

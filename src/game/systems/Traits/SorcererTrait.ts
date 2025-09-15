import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "apMultiplier"

export class SorcererTrait extends Trait {
    name = "Sorcerer"
    description = "When casting a spell, Sorcerers cast an additional spell, with effectiveness reduced by {0}."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { apMultiplier: 0.5, descriptionParams: ["50%"] }],
        [4, { apMultiplier: 0.75, descriptionParams: ["25%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.sorcererTrait
        if (previousHandler) {
            character.off("cast", previousHandler)
        }

        const castHandler = () => {
            character.scene?.time.delayedCall(500, () => {
                character.castAbility(values.apMultiplier)
            })
        }

        character.eventHandlers.sorcererTrait = castHandler

        character.on("cast", castHandler)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.sorcererTrait
        if (handler) {
            character.off("cast", handler)
            delete character.eventHandlers.sorcererTrait
        }
    }
}

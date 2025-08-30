import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "apMultiplier"

export class SorcererTrait extends Trait {
    name = "Feiticeiro"
    description = "Ao lançar uma magia, feiticeiros lançam um feitiço adicional, com eficácia reduzida em {0}."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([[2, { apMultiplier: 0.5, descriptionParams: ["50%"] }]])

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
            console.log("cast handler here")
            character.scene?.time.delayedCall(500, () => {
                console.log("casting again")
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

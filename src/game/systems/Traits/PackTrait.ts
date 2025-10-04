import { Character } from "../../creature/character/Character"
import { Creature } from "../../creature/Creature"
import { Trait } from "./Trait"

type TraitBoosts = "damageMultiplier"

export class PackTrait extends Trait {
    name = "Pack"
    description = "Enemies receive {0} additional damage when attacked by a pack member"
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { damageMultiplier: 0.1, descriptionParams: ["10%"] }],
        [3, { damageMultiplier: 0.2, descriptionParams: ["20%"] }],
        [4, { damageMultiplier: 0.3, descriptionParams: ["30%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.packTrait
        if (previousHandler) {
            character.off("dealt-damage", previousHandler)
        }

        const tickDamage = (target: Creature, damage: number) => {
            const extraDamage = damage * values.damageMultiplier
            target.takeDamage(extraDamage, character, "true", false, false, `${this.name} Bonus`)
        }

        character.eventHandlers.packTrait = tickDamage

        character.on("dealt-damage", tickDamage)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.packTrait
        if (handler) {
            character.off("dealt-damage", handler)
            delete character.eventHandlers.packTrait
        }
    }
}

import { Character } from "../../creature/character/Character"
import { Creature } from "../../creature/Creature"
import { Trait } from "./Trait"

type TraitBoosts = "damageMultiplier"

export class PackTrait extends Trait {
    name = "Matilha"
    description = "Inimigos recebem {0} de dano adicional ao serem atacados por um membro da matilha"
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { damageMultiplier: 0.1, descriptionParams: ["10%"] }],
        [3, { damageMultiplier: 0.2, descriptionParams: ["20%"] }],
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
            target.takeDamage(extraDamage, character, "true", false, false)
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

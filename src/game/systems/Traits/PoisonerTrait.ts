import { Character } from "../../creature/character/Character"
import { Creature } from "../../creature/Creature"
import { DamageType } from "../../ui/DamageNumbers"
import { Trait } from "./Trait"

type TraitBoosts = "damageMultiplier"

type PoisonerStage = Record<TraitBoosts, number> & {
    descriptionParams: string[]
}

const nervousSystemShockSource = "Nervous System Shock"

export class PoisonerTrait extends Trait {
    name = "Poisoner"
    description = "Enemies hit by poison damage suffer {0} of that poison damage again as true damage from nervous system shock."
    stages: Map<number, PoisonerStage> = new Map([
        [2, { damageMultiplier: 0.2, descriptionParams: ["20%"] }],
        [4, { damageMultiplier: 0.4, descriptionParams: ["40%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.poisonerTrait
        if (previousHandler) {
            character.off("dealt-damage", previousHandler)
        }

        const shockNervousSystem = (target: Creature, damage: number, damageType: DamageType) => {
            if (damageType !== "poison") return

            const extraDamage = damage * values.damageMultiplier
            target.takeDamage(extraDamage, character, "true", false, false, nervousSystemShockSource)
        }

        character.eventHandlers.poisonerTrait = shockNervousSystem

        character.on("dealt-damage", shockNervousSystem)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.poisonerTrait
        if (handler) {
            character.off("dealt-damage", handler)
            delete character.eventHandlers.poisonerTrait
        }
    }
}

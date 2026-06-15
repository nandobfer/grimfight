import { Character } from "../../creature/character/Character"
import { Creature } from "../../creature/Creature"
import { Trait } from "./Trait"

type TraitBoosts = "bonusCritChance" | "bonusCritDamageMultiplier" | "executeDamageMultiplier"

type AssassinStage = Record<TraitBoosts, number> & {
    descriptionParams: string[]
}

const executeHealthThreshold = 0.2

export class AssassinTrait extends Trait {
    name = "Assassin"
    description =
        "Assassins gain {0} critical hit chance, {1} critical damage, and deal {2} extra damage to enemies below 20% health."
    stages: Map<number, AssassinStage> = new Map([
        [2, { bonusCritChance: 20, bonusCritDamageMultiplier: 0.2, executeDamageMultiplier: 0.2, descriptionParams: ["20%", "20%", "20%"] }],
        [4, { bonusCritChance: 40, bonusCritDamageMultiplier: 0.4, executeDamageMultiplier: 0.4, descriptionParams: ["40%", "40%", "40%"] }],
        [6, { bonusCritChance: 60, bonusCritDamageMultiplier: 0.6, executeDamageMultiplier: 0.6, descriptionParams: ["60%", "60%", "60%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.assassinTrait
        if (previousHandler) {
            character.off("dealt-damage", previousHandler)
        }

        const executeWoundedTarget = (target: Creature, damage: number) => {
            if (target.maxHealth <= 0 || target.health / target.maxHealth > executeHealthThreshold) return

            target.takeDamage(damage * values.executeDamageMultiplier, character, "true", false, false, this.name)
        }

        character.eventHandlers.assassinTrait = executeWoundedTarget
        character.critChance += values.bonusCritChance
        character.critDamageMultiplier += values.bonusCritDamageMultiplier

        character.on("dealt-damage", executeWoundedTarget)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.assassinTrait
        if (handler) {
            character.off("dealt-damage", handler)
            delete character.eventHandlers.assassinTrait
        }
    }
}

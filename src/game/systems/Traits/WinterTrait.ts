import { Character } from "../../creature/character/Character"
import { Creature } from "../../creature/Creature"
import { Freeze } from "../../objects/StatusEffect/Freeze"
import { RNG } from "../../tools/RNG"
import { Trait } from "./Trait"

type TraitBoosts = "freezeChance" | "critChanceBonus"

export class WinterTrait extends Trait {
    name = "Winter"
    description =
        "Winter characters have a {0} chance to freeze the enemy for 1 second when attacking. Additionally, their attacks have {1} more chance to critically hit frozen targets."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { freezeChance: 5, critChanceBonus: 20, descriptionParams: ["5%", "20%"] }],
        [4, { freezeChance: 10, critChanceBonus: 40, descriptionParams: ["10%", "40%"] }],
        [6, { freezeChance: 15, critChanceBonus: 60, descriptionParams: ["15%", "60%"] }],
    ])

    originalTryCrits = new WeakMap<Character, (bonus?: number) => boolean>()

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.winterTrait
        if (previousHandler) {
            character.off("dealt-damage", previousHandler)
        }

        const onAttack = (target: Creature) => {
            if (RNG.chance() <= values.freezeChance) {
                new Freeze(target, character, 1000).start()
            }
        }

        character.eventHandlers.winterTrait = onAttack

        character.on("dealt-damage", onAttack)
        character.once("destroy", () => this.cleanup(character))

        this.resetCharacterTryCrit(character)
        const originalTryCrit = character.tryCrit.bind(character)
        this.originalTryCrits.set(character, originalTryCrit)

        character.tryCrit = (bonus) => {
            let critChanceBonus = bonus
            if (character.target?.frozen) {
                critChanceBonus += values.critChanceBonus
            }
            return originalTryCrit(critChanceBonus)
        }
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.winterTrait
        if (handler) {
            character.off("dealt-damage", handler)
            delete character.eventHandlers.winterTrait
        }
        this.resetCharacterTryCrit(character)
    }

    resetCharacterTryCrit(character: Character) {
        const originalTryCrit = this.originalTryCrits.get(character)
        if (originalTryCrit) {
            character.tryCrit = originalTryCrit
            this.originalTryCrits.delete(character)
        }
    }
}

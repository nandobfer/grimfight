import { Character } from "../../creature/character/Character"
import { Creature } from "../../creature/Creature"
import { Frozen } from "../../fx/Frozen"
import { Condition } from "../../objects/StatusEffect/Condition"
import { RNG } from "../../tools/RNG"
import { Trait } from "./Trait"

type TraitBoosts = "freezeChance" | "critChanceBonus"

export class PopsicleTrait extends Trait {
    name = "Picolé"
    description =
        "Picolés têm {0} de chance de congelar o inimigo por 1 segundo, ao atacar. Além disso, seus ataques têm {1} mais chance de acertar criticamente alvos congelados."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { freezeChance: 20, critChanceBonus: 20, descriptionParams: ["20%", "20%"] }],
        [4, { freezeChance: 30, critChanceBonus: 40, descriptionParams: ["30%", "40%"] }],
    ])

    originalTryCrits = new WeakMap<Character, (bonus?: number) => boolean>()

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.popsicleTrait
        if (previousHandler) {
            character.off("dealt-damage", previousHandler)
        }

        const onAttack = (target: Creature, damage: number) => {
            if (RNG.chance() <= values.freezeChance) {
                const freeze = new Condition({
                    attributes: ["frozen"],
                    values: [true],
                    duration: 1000,
                    target: target,
                    user: character,
                    renderFx: () => new Frozen(character?.scene || target.scene, target.x, target.y, target),
                })

                freeze.start()
            }
        }

        character.eventHandlers.popsicleTrait = onAttack

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
        const handler = character.eventHandlers.popsicleTrait
        if (handler) {
            character.off("dealt-damage", handler)
            delete character.eventHandlers.popsicleTrait
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

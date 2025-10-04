import { Character } from "../../creature/character/Character"
import { Dot } from "../../objects/StatusEffect/Dot"
import { Trait } from "./Trait"

type TraitBoosts = "baseDamage"

export class IncendiaryTrait extends Trait {
    name = "Incendiary"
    description =
        "When casting their ability, Pyromancers apply a burn to the target, dealing {0} average damage over 5 seconds. The damage is based on the caster's maximum mana."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { baseDamage: 100, descriptionParams: ["100 (+ 10 por andar)"] }],
        [4, { baseDamage: 200, descriptionParams: ["200 (+ 20 por andar)"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.incendiaryTrait
        if (previousHandler) {
            character.off("cast", previousHandler)
        }

        const addBurn = () => {
            if (!character.target) return
            const baseDamage = ((values.baseDamage + (character.scene.floor * values.baseDamage) / 10) * character.maxMana) / 100
            const burn = new Dot({
                damageType: "fire",
                duration: 5000,
                target: character.target,
                tickDamage: baseDamage / 5,
                tickRate: 1000,
                user: character,
                abilityName: this.name,
            })

            burn.start()
        }

        character.eventHandlers.incendiaryTrait = addBurn

        character.on("cast", addBurn)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.incendiaryTrait
        if (handler) {
            character.off("cast", handler)
            delete character.eventHandlers.incendiaryTrait
        }
    }
}

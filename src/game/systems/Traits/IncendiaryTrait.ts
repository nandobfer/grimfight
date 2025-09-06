import { Character } from "../../creature/character/Character"
import { Dot } from "../../objects/Dot"
import { Trait } from "./Trait"

type TraitBoosts = "baseDamage"

export class IncendiaryTrait extends Trait {
    name = "Incendiário"
    description =
        "Ao lançar sua habilidade, incendiários aplicam uma queimadura no alvo, causando {0} de dano médio ao longo de 5 segundos. O dano é baseado na mana máxima do lançador."
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
                tickDamage: baseDamage/5,
                tickRate: 1000,
                user: character,
            })

            character.target.applyStatusEffect(burn)
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

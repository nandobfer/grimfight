import { Character } from "../../creature/character/Character"
import { Trait } from "./Trait"

type TraitBoosts = "bonusCritChance" | "bonusCritMultiplier"

export class AssassinTrait extends Trait {
    name = "Assassino"
    description =
        "Assassinos ganham {0} chance de acerto crítico e cada assassinato bem sucedido concede {1} para seu multiplicador de dano crítico, permanentemente"
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { bonusCritChance: 20, bonusCritMultiplier: 0.01, descriptionParams: ["20%", "1%"] }],
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
            character.off("kill", previousHandler)
        }

        const killHandler = () => {
            character.baseCritDamageMultiplier += values.bonusCritMultiplier
        }

        character.eventHandlers.assassinTrait = killHandler
        character.critChance += values.bonusCritChance

        character.on("kill", killHandler)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.assassinTrait
        if (handler) {
            character.off("kill", handler)
            delete character.eventHandlers.assassinTrait
        }
    }
}

import { Character } from "../../creature/character/Character"
import { HolyHeal } from "../../fx/HolyHeal"
import { Trait } from "./Trait"

type TraitBoosts = "healingFactor"

export class HolyTrait extends Trait {
    name = "Holy"
    description = "When casting a spell, holy characters heal the lowest health holy ally for {0} of his missing health."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { healingFactor: 0.1, descriptionParams: ["10%"] }],
        // [4, { healingFactor: 0.75, descriptionParams: ["25%"] }],
    ])

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
            const holyAllies = character.team.getChildren(true, true).filter((item) => this.activeComp.has(item.name))
            const target = character.team.getLowestHealth(holyAllies)
            if (target) {
                const missingHealthPercent = target.health / target.maxHealth
                const healAmount = target.maxHealth * values.healingFactor * (1 - missingHealthPercent)
                target.heal(healAmount, { healer: character, source: this.name })
                new HolyHeal(character.scene, target.x, target.y)
            }
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

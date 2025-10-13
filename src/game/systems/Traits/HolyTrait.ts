import { Character } from "../../creature/character/Character"
import { HolyHeal } from "../../fx/HolyHeal"
import { Trait } from "./Trait"

type TraitBoosts = "healingFactor" | "manaPerSecond"

export class HolyTrait extends Trait {
    name = "Holy"
    description =
        "Holy characters have {0} bonus mana per second. When casting a spell, holy characters heal the lowest health holy ally for {1} of his missing health."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { healingFactor: 0.1, manaPerSecond: 3, descriptionParams: ["3", "10%"] }],
        [4, { healingFactor: 0.15, manaPerSecond: 5, descriptionParams: ["5", "15%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        character.addStatValue("manaPerSecond", values.manaPerSecond)

        const previousHandler = character.eventHandlers.holyTrait
        if (previousHandler) {
            character.off("cast", previousHandler)
        }

        const castHandler = () => {
            const holyAllies = character.team.getChildren(true, true).filter((item) => this.activeComp.has(item.name))
            const target = character.team.getLowestHealth(holyAllies)
            if (target) {
                const missingHealthPercent = target.health / target.maxHealth
                const healAmount = target.maxHealth * values.healingFactor * (1 - missingHealthPercent)
                target.heal(healAmount, { healer: character, source: `Trait: ${this.name}` })
                new HolyHeal(character.scene, target.x, target.y)
            }
        }

        character.eventHandlers.holyTrait = castHandler

        character.on("cast", castHandler)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.holyTrait
        if (handler) {
            character.off("cast", handler)
            delete character.eventHandlers.holyTrait
        }
    }
}

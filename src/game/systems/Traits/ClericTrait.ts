import { Creature } from "../../creature/Creature"
import { SoulParticles } from "../../fx/SoulParticles"
import { Trait } from "./Trait"

type TraitBoosts = "hpMultiplier" | "statsMultiplier"

export class ClericTrait extends Trait {
    name = "Cleric"
    description = "When an ally dies, clerics gain {0} bonus Health and {1} AD and AP for the rest of the fight."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [1, { hpMultiplier: 10, statsMultiplier: 20, descriptionParams: ["10%", "20%"] }],
        [4, { hpMultiplier: 15, statsMultiplier: 30, descriptionParams: ["15%", "30%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(creature: Creature): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = creature.eventHandlers.clericTrait
        if (previousHandler) {
            creature.team.off("died", previousHandler)
        }

        const diedHandler = (dead: Creature) => {
            if (dead.master) return

            new SoulParticles(creature.scene, creature.x, creature.y, 0.75)
            creature.addStatPercent("maxHealth", values.hpMultiplier)
            creature.addStatPercent("health", values.hpMultiplier)
            creature.addStatPercent("attackDamage", values.statsMultiplier)
            creature.addStatPercent("abilityPower", values.statsMultiplier)
        }

        creature.eventHandlers.clericTrait = diedHandler

        creature.team.on("died", diedHandler)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature) {
        const handler = creature.eventHandlers.clericTrait
        if (handler) {
            creature.team.off("died", handler)
            delete creature.eventHandlers.clericTrait
        }
    }
}

import { Creature } from "../../creature/Creature"
import { DeathSkullFx } from "../../fx/DeathSkullFx"
import { SoulParticles } from "../../fx/SoulParticles"
import { Trait } from "./Trait"

type TraitBoosts = "hpMultiplier" | "statsMultiplier"

export class DeathEaterTrait extends Trait {
    name = "Deatheater"
    description =
        "When dying for the first time, Death's Feast champions revive with a shield of {0} of their health and gain {1} AD and AP until they die again."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { hpMultiplier: 0.3, statsMultiplier: 0.75, descriptionParams: ["30%", "75%"] }],
        [4, { hpMultiplier: 0.45, statsMultiplier: 1.25, descriptionParams: ["45%", "125%"] }],
    ])

    private dead = new Set<Creature>()

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(creature: Creature): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = creature.eventHandlers.deathEaterTrait
        if (previousHandler) {
            creature.off("died", previousHandler)
        }

        const diedHandler = () => {
            if (this.dead.has(creature)) return
            this.dead.add(creature)
            const deadX = creature.x
            const deadY = creature.y
            new DeathSkullFx(creature.scene, deadX, deadY, 0.75)
            creature.scene?.time.delayedCall(1000, () => {
                if (creature?.scene?.state === "fighting") {
                    new SoulParticles(creature.scene, deadX, deadY, 0.75)
                    creature.health = 0
                    creature.gainShield(creature.maxHealth * values.hpMultiplier)
                    creature.revive()
                    creature.removeFromEnemyTarget(1000)
                    creature.attackDamage += creature.baseAttackDamage * values.statsMultiplier
                    creature.abilityPower += creature.baseAbilityPower * values.statsMultiplier
                    creature.teleportTo(deadX, deadY)
                }
            })
        }

        creature.eventHandlers.deathEaterTrait = diedHandler

        creature.on("died", diedHandler)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature) {
        const handler = creature.eventHandlers.deathEaterTrait
        if (handler) {
            creature.off("died", handler)
            delete creature.eventHandlers.deathEaterTrait
        }

        this.dead.delete(creature)
    }
}

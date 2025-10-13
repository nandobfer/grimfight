import { Lalatina } from "../../creature/classes/Lalatina"
import { Creature } from "../../creature/Creature"
import { HolySwordsFx } from "../../fx/HolySwordsFx"
import { RNG } from "../../tools/RNG"
import { PaladinAura } from "./PaladinAura"

export class SmiteAura extends PaladinAura {
    caster: Lalatina

    constructor(caster: Lalatina) {
        super(caster, "Smite Aura", HolySwordsFx)
        this.caster = caster
        this.id = `smiteaura_${RNG.uuid()}`
    }

    override applyModifier(creature: Creature) {
        super.applyModifier(creature)
        
        const previousHandler = creature.eventHandlers[this.id]
        if (previousHandler) {
            creature.off("dealt-damage-crit", previousHandler)
        }
        const onCrit = (victim: Creature, damage: number) => {
            const {value, crit} = this.caster.calculateDamage(this.caster.abilityPower * 0.5)
            victim.takeDamage(value, creature, 'holy', crit, false, this.name)
        }

        creature.eventHandlers[this.id] = onCrit

        creature.on("dealt-damage-crit", onCrit)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[this.id]
        if (handler) {
            creature.off("dealt-damage-crit", handler)
            delete creature.eventHandlers[this.id]
        }
    }
}

import { Lalatina } from "../../creature/classes/Lalatina"
import { Creature } from "../../creature/Creature"
import { HolyCrossFx } from "../../fx/HolyCrossFx"
import { RNG } from "../../tools/RNG"
import { PaladinAura } from "./PaladinAura"


export class GuardianAura extends PaladinAura {
    caster: Lalatina

    constructor(caster: Lalatina) {
        super(caster, "Guardian Aura", HolyCrossFx)
        this.caster = caster
        this.id = `guardianaura_${RNG.uuid()}`
    }

    override applyModifier(creature: Creature) {
        super.applyModifier(creature)
        
        const previousHandler = creature.eventHandlers[this.id]
        if (previousHandler) {
            creature.off("healed", previousHandler)
        }
        const onHealed = (healedValue: number, healer: Creature) => {
            creature.gainShield(healedValue * 0.3, { healer, source: this.name })
        }

        creature.eventHandlers[this.id] = onHealed

        creature.on("healed", onHealed)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[this.id]
        if (handler) {
            creature.off("healed", handler)
            delete creature.eventHandlers[this.id]
        }
    }
}

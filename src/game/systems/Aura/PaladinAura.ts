import { Lalatina } from "../../creature/classes/Lalatina"
import { Creature } from "../../creature/Creature"
import { HolyCrossFx } from "../../fx/HolyCrossFx"
import { Aura } from "./Aura"

export class PaladinAura extends Aura {
    caster: Lalatina
    fx: typeof HolyCrossFx

    constructor(caster: Lalatina, name: string, fx: typeof HolyCrossFx) {
        super({ name })
        this.caster = caster
        this.fx = fx
    }

    applyModifier(creature: Creature): void {
        new this.fx(this.caster.scene, creature.x + 32, creature.y - 64)
    }

}

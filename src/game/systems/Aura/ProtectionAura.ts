import { Lalatina } from "../../creature/classes/Lalatina"
import { Creature } from "../../creature/Creature"
import { HolyShieldFx } from "../../fx/HolyShieldFx"
import { RNG } from "../../tools/RNG"
import { PaladinAura } from "./PaladinAura"

export class ProtectionAura extends PaladinAura {
    caster: Lalatina

    constructor(caster: Lalatina) {
        super(caster, "Protection Aura", HolyShieldFx)
        this.caster = caster
        this.id = `protectionaura_${RNG.uuid()}`
    }

    override applyModifier(creature: Creature) {
        super.applyModifier(creature)

        creature.addStatValue("armor", 15)
    }
}

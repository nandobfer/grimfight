import { AttributeStatus, Creature } from "../../creature/Creature"
import { RNG } from "../../tools/RNG"

export interface AuraParams {
    name: string
    stats?: Partial<Record<AttributeStatus, number>>
}

export class Aura {
    name: string
    stats?: Partial<Record<AttributeStatus, number>>
    id = RNG.uuid()

    constructor(params: AuraParams) {
        this.name = params.name
        this.stats = params.stats
    }

    // each aura must override
    applyModifier(creature: Creature) {}

    tryApply(creature: Creature) {
        this.cleanup(creature)
        this.applyModifier(creature)
    }

    // each aura must override
    afterApplying(creatures: Creature[]) {}

    // each aura must override
    cleanup(creature: Creature) {}
}

import { Creature } from "../creature/Creature"
import { CreatureGroup } from "../creature/CreatureGroup"
import { DamageType } from "../ui/DamageNumbers"
import { EventBus } from "./EventBus"

export type MeterType = "physical" | "magical" | "true"

export interface DamageMeter {
    character: Creature
    // damage: number
    physical: number
    magical: number
    true: number
    total: number
}

export class DamageChart {
    team: CreatureGroup
    damageMeter = new Map<string, DamageMeter>()
    damageMeterArray: DamageMeter[] = []

    constructor(team: CreatureGroup) {
        this.team = team

        this.reset()

        EventBus.on("request-damage-chart", () => {
            this.reset()
        })
    }

    plotDamage(character: Creature, damageDealt: number, damageType: DamageType) {
        const meter = this.damageMeter.get(character.id) || { character, magical: 0, physical: 0, true: 0, total: 0 }
        const meterType: MeterType = damageType === "true" ? "true" : damageType === "normal" ? "physical" : "magical"
        const currentDamage = meter[meterType]
        meter[meterType] += damageDealt + currentDamage
        meter.total += meter[meterType]

        this.damageMeter.set(character.id, meter)
        this.updateMeterArray()
        this.emitArray()
    }

    private updateMeterArray() {
        this.damageMeterArray = Array.from(this.damageMeter.values())
    }

    emitArray() {
        EventBus.emit("damage-chart", this.damageMeterArray)
    }

    reset() {
        this.damageMeter.clear()
        const characters = this.team.getChildren()
        for (const character of characters) {
            this.damageMeter.set(character.id, { character, magical: 0, physical: 0, true: 0, total: 0 })
        }

        this.updateMeterArray()
        this.emitArray()
    }
}

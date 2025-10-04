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

    details: Map<string, { physical: number; magical: number; true: number; total: number; name: string }>
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

    plotDamage(character: Creature, damageDealt: number, damageType: DamageType, sourceName: string) {
        const meter = this.damageMeter.get(character.id) || { character, magical: 0, physical: 0, true: 0, total: 0, details: new Map() }
        const meterType: MeterType = damageType === "true" ? "true" : damageType === "normal" ? "physical" : "magical"
        meter[meterType] += damageDealt
        meter.total = meter.magical + meter.physical + meter.true

        const detail = meter.details.get(sourceName) || { physical: 0, magical: 0, true: 0, total: 0, name: sourceName }
        detail[meterType] += damageDealt
        detail.total = detail.physical + detail.magical + detail.true
        meter.details.set(sourceName, detail)

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
            this.damageMeter.set(character.id, { character, magical: 0, physical: 0, true: 0, total: 0, details: new Map() })
        }

        this.updateMeterArray()
        this.emitArray()
    }
}

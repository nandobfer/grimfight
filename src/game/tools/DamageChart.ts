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

export interface HealingMeter {
    character: Creature
    total: number
    healed: number
    shielded: number

    details: Map<string, { healed: number; shielded: number; total: number; name: string }>
}

export class DamageChart {
    team: CreatureGroup
    damageMeter = new Map<string, DamageMeter>()
    damageMeterArray: DamageMeter[] = []

    healingMeter = new Map<string, HealingMeter>()

    constructor(team: CreatureGroup) {
        this.team = team

        this.reset()
        EventBus.on("request-damage-chart", this.reset, this)
    }

    plotHealing(character: Creature, amountHealed: number, healType: "healed" | "shielded", sourceName: string) {
        const meter = this.healingMeter.get(character.id) || { character, healed: 0, shielded: 0, total: 0, details: new Map() }
        meter[healType] += amountHealed
        meter.total = meter.healed + meter.shielded

        const detail = meter.details.get(sourceName) || { healed: 0, shielded: 0, total: 0, name: sourceName }
        detail[healType] += amountHealed
        detail.total = detail.healed + detail.shielded
        meter.details.set(sourceName, detail)

        this.healingMeter.set(character.id, meter)
        this.emitHealing()
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
        this.emitDamageArray()
    }

    private updateMeterArray() {
        this.damageMeterArray = Array.from(this.damageMeter.values())
    }

    emitHealing() {
        EventBus.emit("healing-chart", this.healingMeter)
    }

    emitDamageArray() {
        EventBus.emit("damage-chart", this.damageMeterArray)
    }

    reset() {
        this.damageMeter.clear()
        this.healingMeter.clear()
        const characters = this.team.getChildren()
        for (const character of characters) {
            this.damageMeter.set(character.id, { character, magical: 0, physical: 0, true: 0, total: 0, details: new Map() })
            // this.healingMeter.set(character.id, { character, healed: 0, shielded: 0, total: 0, details: new Map() })
        }

        this.updateMeterArray()
        this.emitDamageArray()
    }

    dispose() {
        EventBus.off("request-damage-chart", this.reset, this)
        // nothing else to remove; consumers subscribe on mount and clean themselves
    }
}

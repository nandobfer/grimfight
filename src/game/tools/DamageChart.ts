import { Creature } from "../creature/Creature"
import { CreatureGroup } from "../creature/CreatureGroup"
import { EventBus } from "./EventBus"

export interface DamageMeter {
    character: Creature
    damage: number
}

export class DamageChart {
    team: CreatureGroup
    damageMeter = new Map<string, DamageMeter>()
    damageMeterArray: DamageMeter[] = []

    constructor(team: CreatureGroup) {
        this.team = team

        this.reset()

        EventBus.on("request-damage-chart", () => {
            this.emitArray()
        })
    }

    plotDamage(character: Creature, damage: number) {
        this.damageMeter.set(character.id, { character, damage })
        this.updateMeterArray()
        this.emitArray()
    }

    private updateMeterArray() {
        this.damageMeterArray = Array.from(this.damageMeter.values())
    }

    private emitArray() {
        EventBus.emit("damage-chart", this.damageMeterArray)
    }

    reset() {
        this.damageMeter.clear()
        const characters = this.team.getChildren()
        for (const character of characters) {
            this.damageMeter.set(character.id, { character, damage: 0 })
        }

        this.updateMeterArray()
        this.emitArray()
    }
}

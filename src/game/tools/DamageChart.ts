import { Character } from "../characters/Character"
import { CharacterGroup } from "../characters/CharacterGroup"
import { EventBus } from "./EventBus"

export interface DamageMeter {
    character: Character
    damage: number
}

export class DamageChart {
    team: CharacterGroup
    damageMeter = new Map<string, DamageMeter>()
    damageMeterArray: DamageMeter[] = []
    private emitUpdate = false

    constructor(team: CharacterGroup) {
        this.team = team
        if (this.team.isPlayer) {
            this.emitUpdate = true
        }

        this.reset()

        EventBus.on('request-damage-chart', () => {
            this.emitArray()
        })
        
    }

    plotDamage(character: Character, damage: number) {
        this.damageMeter.set(character.id, { character, damage })
        this.updateMeterArray()
        this.emitArray()
    }

    private updateMeterArray() {
        this.damageMeterArray = Array.from(this.damageMeter.values())
    }

    private emitArray() {
        if (this.emitUpdate) {
            EventBus.emit("damage-chart", this.damageMeterArray)
        }
    }

    reset() {
        this.damageMeter.clear()
        const characters = this.team.getChildren()
        for (const character of characters) {
            this.damageMeter.set(character.id, {character, damage: 0})
        }

        this.updateMeterArray()
        this.emitArray()
    }
}

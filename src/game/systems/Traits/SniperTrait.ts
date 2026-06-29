import type { Character } from "../../creature/character/Character"
import type { Creature } from "../../creature/Creature"
import { applyThresholdUntargetable, cleanupThresholdUntargetable } from "../Combat/ThresholdUntargetable"
import { Trait } from "./Trait"
import { calculateSniperDamageMultiplier, calculateSniperGridDistance, type GridCell } from "./formulas/SniperTraitFormulas"

type TraitBoosts = "damageMultiplierPerGrid" | "untargetableThreshold" | "untargetableDuration"

type SniperStage = Record<TraitBoosts, number> & {
    descriptionParams: string[]
}

export class SniperTrait extends Trait {
    name = "Sniper"
    description =
        "Snipers deal {0} increased damage for each grid between them and their target. Once per combat, they become untargetable after falling to {1} health."
    stages: Map<number, SniperStage> = new Map([
        [2, { damageMultiplierPerGrid: 0.05, untargetableThreshold: 0.15, untargetableDuration: 3000, descriptionParams: ["5%", "15%"] }],
        [4, { damageMultiplierPerGrid: 0.1, untargetableThreshold: 0.25, untargetableDuration: 3000, descriptionParams: ["10%", "25%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.sniperTrait
        if (previousHandler) {
            character.off("dealt-damage", previousHandler)
        }

        const amplifyDamageByDistance = (target: Creature, damage: number) => {
            if (!target.active || damage <= 0) return

            const distance = this.getGridDistance(character, target)
            const damageMultiplier = calculateSniperDamageMultiplier(distance, values.damageMultiplierPerGrid)
            if (damageMultiplier <= 0) return

            target.takeDamage(damage * damageMultiplier, character, "true", false, false, this.name)
        }

        character.eventHandlers.sniperTrait = amplifyDamageByDistance
        character.on("dealt-damage", amplifyDamageByDistance)

        applyThresholdUntargetable(character, {
            key: this.thresholdKey,
            threshold: values.untargetableThreshold,
            duration: values.untargetableDuration,
            source: this.name,
        })

        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.sniperTrait
        if (handler) {
            character.off("dealt-damage", handler)
            delete character.eventHandlers.sniperTrait
        }

        cleanupThresholdUntargetable(character, this.thresholdKey)
    }

    private getGridDistance(character: Character, target: Creature): number {
        const attackerCell = this.getCell(character)
        const targetCell = this.getCell(target)

        if (attackerCell && targetCell) {
            return calculateSniperGridDistance(attackerCell, targetCell)
        }

        const grid = character.scene.grid
        const cellSize = Math.max(1, Math.min(grid.cellW, grid.cellH))
        return Math.floor(Phaser.Math.Distance.Between(character.x, character.y, target.x, target.y) / cellSize)
    }

    private getCell(creature: Creature): GridCell | null {
        const x = creature.boardX > 0 ? creature.boardX : creature.x
        const y = creature.boardY > 0 ? creature.boardY : creature.y
        return creature.scene.grid.worldToCell(x, y)
    }

    private get thresholdKey() {
        return "sniperTrait"
    }
}

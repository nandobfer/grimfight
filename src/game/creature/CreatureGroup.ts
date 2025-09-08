// src/game/creatures/CharacterGroup.ts

import { Game } from "../scenes/Game"
import { Augment } from "../systems/Augment/Augment"
import { convertMuiColorToPhaser } from "../tools/RarityColors"
import { Creature } from "./Creature"

export class CreatureGroup extends Phaser.GameObjects.Group {
    declare scene: Game
    minions: CreatureGroup
    augments: Set<Augment>

    constructor(
        scene: Game,
        minions?: boolean,
        children?: Creature[] | Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig,
        config?: Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig
    ) {
        super(scene, children, config)
        scene.add.existing(this)
        this.runChildUpdate = true
        this.resetMouseEvents()
        this.augments = new Set()
        if (minions) {
            this.minions = new CreatureGroup(scene)
        }
    }

    override getChildren(minions = false, activeOnly = false) {
        let list = super.getChildren() as Creature[]

        if (minions) {
            list = [...list, ...this.minions.getChildren()]
        }

        if (activeOnly) {
            list = list.filter((item) => item.active)
        }

        return list
    }

    override add(child: Creature, addToScene?: boolean): this {
        super.add(child, addToScene)
        child.team = this

        return this
    }

    private resetMouseEvents() {
        const creatures = this.getChildren()
        for (const creature of creatures) {
            creature.resetMouseEvents()
        }
    }

    reset() {
        const creatures = this.getChildren()
        for (const creature of creatures) {
            creature.reset()
        }

        this.minions.clear(true, true)
    }

    override clear(removeFromScene?: boolean, destroyChild?: boolean) {
        const creatures = this.getChildren()
        for (const creature of creatures) {
            creature.destroyUi()
        }
        super.clear(removeFromScene, destroyChild)

        return this
    }

    getCreatureInPosition(x: number, y: number) {
        const creatures = this.getChildren()
        return creatures.find((char) => char.x === x && char.y === y)
    }

    getCreatureInCell(col: number, row: number) {
        const creatures = this.getChildren()
        return creatures.find((char) => {
            const cell = this.scene.grid.worldToCell(char.boardX, char.boardY)
            return cell?.col === col && cell.row === row
        })
    }

    isWiped() {
        const creatures = this.getChildren(true, true)
        return creatures.every((creature) => creature.health <= 0)
    }

    addAugment(augment: Augment) {
        augment.chosenFloor = this.scene.floor
        this.augments.add(augment)
        for (const creature of this.getChildren()) {
            creature.glowTemporarily(convertMuiColorToPhaser(augment.color || "primary"), 5, 2000)
        }
        this.reset()
        this.scene.saveProgress()
    }

    getLowestHealth() {
        const children = this.getChildren(true, true)
        let lowestHealth = Infinity
        let lowestCreature: Creature | null = null

        for (const creature of children) {
            if (creature.health / creature.maxHealth < lowestHealth) {
                lowestCreature = creature
                lowestHealth = creature.health / creature.maxHealth
            }
        }

        return lowestCreature
    }
}

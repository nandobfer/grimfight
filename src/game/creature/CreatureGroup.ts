// src/game/creatures/CharacterGroup.ts

import { Game } from "../scenes/Game"
import { Creature } from "./Creature"

export class CreatureGroup extends Phaser.GameObjects.Group {
    declare scene: Game
    minions: CreatureGroup

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
        if (minions) {
            this.minions = new CreatureGroup(scene)
        }
    }

    override getChildren(minions = false) {
        let list = super.getChildren() as Creature[]

        if (minions) {
            list = [...list, ...this.minions.getChildren()]
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

    getCharacterInPosition(x: number, y: number) {
        const creatures = this.getChildren()
        return creatures.find((char) => char.x === x && char.y === y)
    }

    isWiped() {
        const creatures = this.getChildren()
        return creatures.every((creature) => creature.health <= 0)
    }
}

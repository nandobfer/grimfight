// src/game/creatures/CharacterGroup.ts

import { Game } from "../scenes/Game"
import { DamageChart } from "../tools/DamageChart"
import { Creature } from "./Creature"

export class CreatureGroup extends Phaser.GameObjects.Group {
    declare scene: Game

    constructor(
        scene: Game,
        children?: Creature[] | Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig,
        config?: (Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig) & { isPlayer?: boolean }
    ) {
        super(scene, children, config)
        scene.add.existing(this)
        this.runChildUpdate = true
        this.resetMouseEvents()
    }

    override getChildren() {
        return super.getChildren() as Creature[]
    }

    add(child: Creature, addToScene?: boolean): this {
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
    }

    clear(removeFromScene?: boolean, destroyChild?: boolean) {
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
}

// src/game/characters/CharacterGroup.ts

import { Game } from "../scenes/Game"
import { DamageChart } from "../tools/DamageChart"
import { Character } from "./Character"

export class CharacterGroup extends Phaser.GameObjects.Group {
    isPlayer: boolean = false
    damageChart: DamageChart

    constructor(
        scene: Game,
        children?: Character[] | Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig,
        config?: (Phaser.Types.GameObjects.Group.GroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig) & { isPlayer?: boolean }
    ) {
        super(scene, children, config)
        scene.add.existing(this)
        this.runChildUpdate = true
        this.isPlayer = !!config?.isPlayer
        if (this.isPlayer) {
            this.setChildrenPlayer()
        }
        this.resetMouseEvents()
        this.damageChart = new DamageChart(this)
    }

    override getChildren() {
        return super.getChildren() as Character[]
    }

    add(child: Character, addToScene?: boolean): this {
        super.add(child, addToScene)
        if (this.isPlayer) {
            child.isPlayer = true
            child.resetMouseEvents()
        }

        child.team = this

        return this
    }

    private setChildrenPlayer() {
        const characters = this.getChildren()
        for (const character of characters) {
            character.isPlayer = true
            character.team = this
        }
    }

    private resetMouseEvents() {
        const characters = this.getChildren()
        for (const character of characters) {
            character.resetMouseEvents()
        }
    }

    reset() {
        const characters = this.getChildren()
        const y = this.isPlayer ? 503 : 166

        Phaser.Actions.GridAlign(characters, { cellHeight: 64, cellWidth: 64, y, x: 214 })
        characters.forEach((character) => character.reset())
    }

    clear(removeFromScene?: boolean, destroyChild?: boolean) {
        const characters = this.getChildren()
        for (const character of characters) {
            character.destroyUi()
        }
        super.clear(removeFromScene, destroyChild)

        return this
    }

    getCharacterInPosition(x: number, y: number) {
        const characters = this.getChildren()
        return characters.find((char) => char.x === x && char.y === y)
    }
}

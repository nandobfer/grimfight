// src/game/creature/character/Character.ts

import { Game } from "../../scenes/Game"
import { EventBus } from "../../tools/EventBus"
import { DamageType } from "../../ui/DamageNumbers"
import { LevelBadge } from "../../ui/LevelBadge"
import { Creature } from "../Creature"
import { CharacterGroup } from "./CharacterGroup"

export interface CharacterDto {
    level: number
    name: string
    id: string
    baseMaxHealth: number
    baseAttackSpeed: number
    baseAttackDamage: number
    baseAttackRange: number
    baseMaxMana: number
    baseManaPerSecond: number
    baseManaPerAttack: number
    baseArmor: number
    baseResistance: number
    baseSpeed: number
    baseCritChance: number
    baseCritDamageMultiplier: number
    boardX: number
    boardY: number
}

export class Character extends Creature {
    declare team: CharacterGroup
    private levelBadge!: LevelBadge

    private glowFx: Phaser.FX.Glow
    private preDrag?: { x: number; y: number }

    constructor(scene: Game, name: string, id: string, boardX?: number, boardY?: number) {
        super(scene, name, id)

        this.levelBadge = new LevelBadge(this, { offsetX: 22, offsetY: -15 })
        this.levelBadge.setValue(this.level)
        this.boardX = boardX || 0
        this.boardY = boardY || 0
        this.handleMouseEvents()
    }

    reset() {
        super.reset()
        this.levelBadge.reset()

        if (this.boardX && this.boardY) {
            this.x = this.boardX
            this.y = this.boardY
        }
    }

    loadFromDto(dto: CharacterDto) {
        for (const [key, value] of Object.entries(dto)) {
            this[key as keyof this] = value
        }
    }

    saveInStorage() {
        const dto = this.getDto()
        const characters = this.scene.getSavedCharacters()
        const index = characters.findIndex((c) => c.id === this.id)

        if (index >= 0) {
            characters[index] = dto // Update the array element
        } else {
            characters.push(dto) // Add new character
        }
        this.scene.savePlayerCharacters(characters)
    }

    handleMouseEvents(): void {
        super.handleMouseEvents()

        this.glowFx = this.postFX.addGlow(0xffffff, 8, 0) // White glow
        this.glowFx.outerStrength = 0

        this.scene.input.setDraggable(this)

        this.on("pointerover", () => {
            if (this.scene.state === "idle") {
                this.animateGlow(5)
            }
        })

        this.on("pointerout", () => {
            this.animateGlow(0)
        })

        this.on("dragstart", (pointer: Phaser.Input.Pointer) => {
            if (this.scene.state !== "idle") return
            // remember original pos in case drop is invalid
            this.preDrag = { x: this.x, y: this.y }
            // show allowed tiles overlay immediately
            this.scene.grid.showDropOverlay()
            this.scene.grid.showHighlightAtWorld(pointer.worldX, pointer.worldY)
        })

        this.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (this.scene.state !== "idle") return
            this.setPosition(dragX, dragY)
            this.scene.grid.showHighlightAtWorld(pointer.worldX, pointer.worldY)
        })

        this.on("dragend", (pointer: Phaser.Input.Pointer) => {
            if (this.scene.state !== "idle") return
            // Snap to tile center at drop
            const snapped = this.scene.grid.snapCharacter(this, pointer.worldX, pointer.worldY)
            if (snapped) {
                this.boardX = this.x
                this.boardY = this.y
                this.saveInStorage()
            }

            if (!snapped && this.preDrag) {
                // revert if dropped outside allowed rows
                this.setPosition(this.preDrag.x, this.preDrag.y)
                this.body?.reset(this.preDrag.x, this.preDrag.y)
            }
            this.scene.grid.hideHighlight()
            this.scene.grid.hideDropOverlay()
            this.preDrag = undefined
        })
    }

    private animateGlow(targetStrength: number) {
        if (!this.glowFx) return

        this.scene.tweens.add({
            targets: this.glowFx,
            outerStrength: targetStrength,
            duration: 250, // Animation duration (ms)
            ease: "Sine.easeOut", // Smooth easing
        })
    }

    die() {
        super.die()
        this.levelBadge.fadeOut()
        EventBus.emit(`character-${this.id}-update`, this)
    }

    destroyUi(): void {
        super.destroyUi()
        this.levelBadge.destroy()
    }

    increaseExp() {
        this.experience += 1

        if (this.experience === this.level * 2) {
            this.levelUp()
        }

        this.saveInStorage()
    }

    levelUp() {
        this.experience = 0
        this.level += 1

        this.baseMaxHealth += 50
        this.baseAttackDamage += 5
        this.resetUi()
    }

    resetUi(): void {
        super.resetUi()
        this.levelBadge.reset()
        this.levelBadge.setValue(this.level)
    }

    updateCharUi(): void {
        super.updateCharUi()
        this.levelBadge.updatePosition()
    }

    onAttackLand(damagetype: DamageType): number {
        const damage = super.onAttackLand(damagetype)
        this.team.damageChart.plotDamage(this, damage)

        return damage
    }

    getDto() {
        const data: CharacterDto = {
            level: this.level,
            baseArmor: this.baseArmor,
            baseAttackDamage: this.baseAttackDamage,
            baseAttackRange: this.baseAttackRange,
            baseAttackSpeed: this.baseAttackSpeed,
            baseCritChance: this.baseCritChance,
            baseCritDamageMultiplier: this.baseCritDamageMultiplier,
            baseManaPerAttack: this.baseManaPerAttack,
            baseManaPerSecond: this.baseManaPerSecond,
            baseMaxHealth: this.baseMaxHealth,
            baseMaxMana: this.baseMaxMana,
            baseResistance: this.baseResistance,
            baseSpeed: this.baseSpeed,
            boardX: this.x,
            boardY: this.y,
            id: this.id,
            name: this.name,
        }
        return data
    }

    destroy(fromScene?: boolean): void {
        super.destroy(fromScene)
        this.destroyUi()
    }

    update(time: number, delta: number): void {
        EventBus.emit(`character-${this.id}-update`, this)
        super.update(time, delta)
    }
}

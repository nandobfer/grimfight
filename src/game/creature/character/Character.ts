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
    boardX: number
    boardY: number
    abilityDescription: string
}

export class Character extends Creature {
    declare team: CharacterGroup
    private levelBadge!: LevelBadge

    private glowFx: Phaser.FX.Glow
    private preDrag?: { x: number; y: number }

    baseSpeed = 70
    baseMaxHealth = 300
    baseAbilityPower: number = 0

    abilityDescription: string = ""

    constructor(scene: Game, name: string, id: string, boardX?: number, boardY?: number) {
        super(scene, name, id)

        this.levelBadge = new LevelBadge(this, { offsetX: 22, offsetY: -15 })
        this.levelBadge.setValue(this.level)
        this.boardX = boardX || 0
        this.boardY = boardY || 0
        this.handleMouseEvents()
    }

    override reset() {
        super.reset()
        this.levelBadge.reset()

        if (this.boardX && this.boardY) {
            this.x = this.boardX
            this.y = this.boardY
        }
    }

    loadFromDto(dto: CharacterDto) {
        this.levelUpTo(dto.level)
    }

    handleMouseEvents(): void {
        super.handleMouseEvents()

        this.glowFx = this.postFX.addGlow(0xffffff, 8, 0) // White glow
        this.glowFx.outerStrength = 0

        this.scene.input.setDraggable(this)

        this.on("pointerover", () => {
            // if (this.scene.state === "idle") {
            this.animateGlow(5)
            // }
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
            this.setDepth(this.depth + 1000)
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
                this.team.saveCurrentCharacters()
            }

            if (!snapped && this.preDrag) {
                // revert if dropped outside allowed rows
                this.setPosition(this.preDrag.x, this.preDrag.y)
                this.body?.reset(this.preDrag.x, this.preDrag.y)
            }

            this.scene.grid.hideHighlight()
            this.scene.grid.hideDropOverlay()
            this.preDrag = undefined
            this.updateDepth()
        })

        this.on("pointerup", () => {
            EventBus.emit("select-char", this)
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

    override die() {
        super.die()
        this.levelBadge.fadeOut()
        this.emitSelf()
    }

    override destroyUi(): void {
        super.destroyUi()
        this.levelBadge.destroy()
    }

    emitSelf() {
        EventBus.emit(`character-${this.id}-update`, this)
    }

    levelUp() {
        this.experience = 0
        this.level += 1
        this.levelBadge.setValue(this.level)

        this.baseMaxHealth *= 1.5
        this.baseAttackDamage *= 1.5
        this.baseAbilityPower *= 1.5
        this.baseArmor *= 1.5
        this.reset()
        this.emitSelf()
    }

    levelUpTo(quantity: number) {
        for (let level = 1; level < quantity; level++) {
            this.levelUp()
        }
    }

    override resetUi(): void {
        super.resetUi()
    }

    updateCharUi(): void {
        super.updateCharUi()
        this.levelBadge.updatePosition()
    }

    override onAttackLand(damagetype: DamageType, victim: Creature): number {
        const damage = super.onAttackLand(damagetype, victim)

        return damage
    }

    getDto() {
        const data: CharacterDto = {
            level: this.level,
            boardX: this.x,
            boardY: this.y,
            id: this.id,
            name: this.name,
            abilityDescription: this.abilityDescription,
        }
        return data
    }

    override calculateAttackRange() {
        return super.calculateAttackRange() * Math.max(1, this.scale * 0.75)
    }

    override destroy(fromScene?: boolean): void {
        super.destroy(fromScene)
        this.destroyUi()
    }

    override update(time: number, delta: number): void {
        this.emitSelf()
        super.update(time, delta)
    }
}

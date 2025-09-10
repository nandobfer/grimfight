// src/game/creature/character/Character.ts

import { Game } from "../../scenes/Game"
import { Item } from "../../systems/Items/Item"
import { ItemRegistry } from "../../systems/Items/ItemRegistry"
import { EventBus } from "../../tools/EventBus"
import { DamageType } from "../../ui/DamageNumbers"
import { LevelBadge } from "../../ui/LevelBadge"
import { Creature } from "../Creature"
import { PlayerTeam } from "./PlayerTeam"

export interface CharacterDto {
    level: number
    name: string
    id: string
    boardX: number
    boardY: number
    abilityDescription: string
    baseCritDamageMultiplier: number
    items: string[]
}

export class Character extends Creature {
    declare team: PlayerTeam
    private levelBadge!: LevelBadge

    private glowFx: Phaser.FX.Glow
    private preDrag?: { x: number; y: number }

    baseSpeed = 100
    baseMaxHealth = 300
    baseAbilityPower: number = 50

    abilityDescription: string = ""
    abilityName: string = ""

    private draggingFromBoard = false
    public dropToBench = false
    private globalDragCtrl?: AbortController

    constructor(scene: Game, name: string, id: string, boardX?: number, boardY?: number) {
        super(scene, name, id)

        this.levelBadge = new LevelBadge(this, { offsetX: 22, offsetY: -15 })
        this.levelBadge.setValue(this.level)
        this.boardX = boardX || 0
        this.boardY = boardY || 0
        this.handleMouseEvents()
    }

    override refreshStats() {
        if (this.isRefreshing) return
        this.isRefreshing = true
        try {
            // 1) restore *base* stats (no traits/augments here)
            super.reset()

            // 2) apply layers in desired order
            this.applyItems()
            this.reapplyTraits()
            this.applyAugments()
        } finally {
            this.isRefreshing = false
        }
    }

    override reset() {
        super.reset()

        this.levelBadge.reset()
        if (this.boardX && this.boardY) {
            this.x = this.boardX
            this.y = this.boardY
        }
    }

    reapplyTraits() {
        if (this.team) {
            for (const trait of this.team.activeTraits) {
                trait.tryApply(this)
            }
        }
    }

    loadFromDto(dto: CharacterDto) {
        this.levelUpTo(dto.level)
        this.boardX = dto.boardX
        this.boardY = dto.boardY
        this.baseCritDamageMultiplier = dto.baseCritDamageMultiplier || this.baseCritDamageMultiplier
        for (const entry of dto.items) {
            const item = ItemRegistry.create(entry, this.scene)
            item.snapToCreature(this)
            this.equipItem(item)
        }
    }

    handleMouseEvents(): void {
        super.handleMouseEvents()

        this.glowFx = this.postFX.addGlow(0xffffff, 8, 0) // White glow
        this.glowFx.outerStrength = 0

        this.scene.input.setDraggable(this)

        this.scene.input.dragDistanceThreshold = 32 // pixels before drag starts (default ~16)
        this.scene.input.dragTimeThreshold = 40

        const os = this.scene.sys.game.device.os
        if (os.android || os.iOS) {
            this.scene.input.dragDistanceThreshold *= 2
            this.scene.input.dragTimeThreshold *= 2
        }

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

            this.items.forEach((item) => item.sprite.setVisible(false))

            // remember original pos in case drop is invalid
            this.preDrag = { x: this.x, y: this.y }
            // show allowed tiles overlay immediately
            this.scene.grid.showDropOverlay()
            this.scene.shopkeeper.onCharacterDragGlow(true)
            this.scene.shopkeeper.renderCharacterCost(this)
            this.scene.grid.showHighlightAtWorld(pointer.worldX, pointer.worldY)
            this.setDepth(this.depth + 1000)

            // sending to react
            this.draggingFromBoard = true
            this.dropToBench = false
            // ---- NEW: forward to window so we still track when pointer leaves canvas
            this.globalDragCtrl?.abort()
            const ctrl = new AbortController()
            this.globalDragCtrl = ctrl

            // helper: client/page -> world
            const toWorld = (ev: PointerEvent) => {
                const pageX = ev.clientX + window.scrollX
                const pageY = ev.clientY + window.scrollY
                const gx = this.scene.scale.transformX(pageX)
                const gy = this.scene.scale.transformY(pageY)
                const p = this.scene.cameras.main.getWorldPoint(gx, gy)
                return { x: p.x, y: p.y }
            }

            let rafId: number | null = null
            const onMove = (ev: PointerEvent) => {
                if (rafId != null) return
                rafId = requestAnimationFrame(() => {
                    rafId = null
                    EventBus.emit("ph-drag-move", { clientX: ev.clientX, clientY: ev.clientY })
                })
            }

            const finish = (ev?: PointerEvent | Event) => {
                // tell React we ended; it will decide bench-drop vs bench-cancel
                const pe = ev as PointerEvent | undefined
                EventBus.emit("ph-drag-end", {
                    id: this.id,
                    clientX: pe?.clientX ?? 0,
                    clientY: pe?.clientY ?? 0,
                })
                ctrl.abort()
            }

            window.addEventListener("pointermove", onMove, { signal: ctrl.signal, passive: true })
            window.addEventListener("pointerup", finish, { signal: ctrl.signal })
            window.addEventListener("pointercancel", finish, { signal: ctrl.signal })
            window.addEventListener("blur", finish, { signal: ctrl.signal })
            document.addEventListener(
                "visibilitychange",
                () => {
                    if (document.hidden) finish()
                },
                { signal: ctrl.signal }
            )

            // also emit start so React can show preview immediately
            const ev = pointer.event as PointerEvent | undefined
            EventBus.emit("ph-drag-start", {
                id: this.id,
                dto: this.getDto(),
                clientX: ev?.clientX ?? 0,
                clientY: ev?.clientY ?? 0,
            })
        })

        this.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (this.scene.state !== "idle") return
            this.setPosition(dragX, dragY)
            this.scene.grid.showHighlightAtWorld(pointer.worldX, pointer.worldY)
            // Debug: log when emitting the move event
        })

        this.on("dragend", (pointer: Phaser.Input.Pointer) => {
            if (this.scene?.state !== "idle") return
            this.items.forEach((item) => item.sprite.setVisible(true))

            // always cleanup window listeners
            this.globalDragCtrl?.abort()
            this.globalDragCtrl = undefined

            this.scene.shopkeeper.onCharacterDragGlow(false)
            this.scene.shopkeeper.hideCharacterCost()
            const shopkeeperBounds = this.scene.shopkeeper.getBounds()
            if (shopkeeperBounds.contains(pointer.worldX, pointer.worldY)) {
                this.scene.grid.hideHighlight()
                this.scene.grid.hideDropOverlay()
                EventBus.emit("sell-character-shopkeeper", this)

                this.items.forEach((item) => item.drop())
                return
            }

            // React will set `dropToBench = true` via bench-drop → skip snapping
            if (this.dropToBench) {
                this.preDrag = undefined
                this.scene.grid.hideHighlight()
                this.scene.grid.hideDropOverlay()

                return
            }

            // Snap to tile center at drop
            const snapped = this.scene.grid.snapCharacter(this, pointer.worldX, pointer.worldY)
            if (snapped) {
                this.boardX = this.x
                this.boardY = this.y
                this.refreshStats()
                this.team.saveCurrentCharacters()
            }

            if (!snapped && this.preDrag) {
                // revert if dropped outside allowed rows
                this.setPosition(this.preDrag.x, this.preDrag.y)
                this.body?.reset(this.preDrag.x, this.preDrag.y)
            }

            this.scene.grid.hideHighlight()
            this.scene.grid.hideDropOverlay()

            this.updateDepth()
            this.emit("move", this)
        })

        this.on("pointerup", () => {
            if (this.preDrag) {
                this.preDrag = undefined
                return
            }
            EventBus.emit("select-char", this)
        })

        this.once("destroy", () => {
            this.off("pointerover")
            this.off("pointerout")
            this.off("dragstart")
            this.off("drag")
            this.off("dragend")
            this.off("pointerup")
            this.globalDragCtrl?.abort() // <---- add this
            this.globalDragCtrl = undefined
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
        this.level += 1
        this.levelBadge.setValue(this.level)

        this.baseMaxHealth *= 1.5
        this.baseAttackDamage *= 1.5
        this.baseAbilityPower *= 1.5
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

        this.emit("afterAttack")
        return damage
    }

    getDto() {
        const data: CharacterDto = {
            level: this.level,
            boardX: this.x,
            boardY: this.y,
            id: this.id,
            name: this.name,
            abilityDescription: this.getAbilityDescription(),
            baseCritDamageMultiplier: this.baseCritDamageMultiplier,
            items: Array.from(this.items.values()).map((item) => item.key),
        }
        return data
    }

    // to be overriden
    getAbilityDescription() {
        return ""
    }

    override startCastingAbility(): void {
        super.startCastingAbility()

        console.log("emitting cast")
        this.emit("cast")
    }

    override calculateAttackRange() {
        return super.calculateAttackRange() * Math.max(1, this.scale * 0.75)
    }

    override equipItem(item: Item, fromThiefsGloves = false): void {
        super.equipItem(item, fromThiefsGloves)
        if (!fromThiefsGloves) this.scene.availableItems.delete(item)
        this.team.saveCurrentCharacters()
        this.scene.saveProgress()
    }

    override unequipItem(item: Item, fromThiefsGloves = false): void {
        super.unequipItem(item, fromThiefsGloves)
        if (!fromThiefsGloves) this.scene.availableItems.add(item)
        this.team.saveCurrentCharacters()
        this.scene.saveProgress()
    }

    override destroy(fromScene?: boolean): void {
        super.destroy(fromScene)
        this.destroyUi()
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
    }
}

import Phaser from "phaser"
import type { Game } from "../scenes/Game"
import type { Creature, Direction } from "../creature/Creature"
import type { Projectile } from "../objects/Projectile/Projectile"
import { EventBus } from "../tools/EventBus"
import {
    EDNO_AEGIS_DURATION_MS,
    EDNO_SHIELD_BULGE,
    EDNO_SHIELD_DEPTH,
    EDNO_SHIELD_FRONT_DISTANCE,
    EDNO_SHIELD_STACK_OFFSET,
    EDNO_SHIELD_WIDTH,
    ednoShieldCount,
} from "../creature/classes/EdnoAegis"

const FACING_VECTORS: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
}

/** Rotation that maps the crescent's local +X (its bulge) onto the facing direction. */
const FACING_ANGLES: Record<Direction, number> = {
    right: 0,
    down: Math.PI / 2,
    left: Math.PI,
    up: -Math.PI / 2,
}

const SPECTRAL_FILL = 0x63e6d6
const SPECTRAL_RIM = 0xbdf6ff
const SPECTRAL_GOLD = 0xd8b24a
const SPECTRAL_GEM = 0x9cff6a

const CRESCENT_STEPS = 14

/**
 * A conjured spectral aegis: one translucent crescent shield per pip of Edno's
 * fate die, stacked one in front of the other, bulging toward the enemy. While
 * active it blocks every enemy projectile that collides with it. It is a
 * lingering effect: it lives for its own duration and is not torn down when the
 * caster dies.
 */
export class EdnoSpectralShield {
    private readonly scene: Game
    private readonly ownerTeam: Creature["team"]
    private readonly onCleanup: () => void
    private readonly graphic: Phaser.GameObjects.Graphics
    private readonly hitbox: Phaser.GameObjects.Zone
    private readonly shieldCenters: Array<{ x: number; y: number }>
    private readonly angle: number
    private overlap?: Phaser.Physics.Arcade.Collider
    private age = 0
    private cleaned = false

    private readonly onGameState = () => this.cleanup()

    private readonly onProjectileHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (object1) => {
        const projectile = object1 as unknown as Projectile
        if (!projectile || !projectile.active || !projectile.owner) return
        if (this.isAlly(projectile.owner)) return

        try {
            this.scene.onHitFx(projectile.damageType, projectile.x, projectile.y)
        } catch {}

        projectile.destroy(true)
    }

    private readonly update = (_time: number, delta: number) => {
        if (this.cleaned) return

        if (!this.graphic.active || this.scene.state !== "fighting") {
            this.cleanup()
            return
        }

        this.age += delta
        if (this.age >= EDNO_AEGIS_DURATION_MS) {
            this.cleanup()
            return
        }

        this.draw()
    }

    constructor(owner: Creature, roll: number, onCleanup: () => void) {
        this.scene = owner.scene
        this.ownerTeam = owner.team
        this.onCleanup = onCleanup

        const count = Math.max(1, ednoShieldCount(roll))
        const direction = owner.facing
        const axial = FACING_VECTORS[direction]
        const perpendicular = { x: -axial.y, y: axial.x }
        this.angle = FACING_ANGLES[direction]

        const originX = owner.x + axial.x * EDNO_SHIELD_FRONT_DISTANCE
        const originY = owner.y + axial.y * EDNO_SHIELD_FRONT_DISTANCE

        this.shieldCenters = []
        for (let index = 0; index < count; index++) {
            const offset = index * EDNO_SHIELD_STACK_OFFSET
            this.shieldCenters.push({ x: originX + axial.x * offset, y: originY + axial.y * offset })
        }

        const firstCenter = this.shieldCenters[0]
        const lastCenter = this.shieldCenters[count - 1]
        const axialExtent = (count - 1) * EDNO_SHIELD_STACK_OFFSET + EDNO_SHIELD_BULGE
        const boxWidth = Math.abs(axial.x) * axialExtent + Math.abs(perpendicular.x) * EDNO_SHIELD_WIDTH
        const boxHeight = Math.abs(axial.y) * axialExtent + Math.abs(perpendicular.y) * EDNO_SHIELD_WIDTH

        this.graphic = this.scene.add.graphics()
        this.graphic.setDepth(owner.depth + 2)
        this.graphic.setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(this.graphic)

        this.hitbox = this.scene.add.zone((firstCenter.x + lastCenter.x) / 2, (firstCenter.y + lastCenter.y) / 2, boxWidth, boxHeight)
        this.scene.physics.add.existing(this.hitbox, true)
        this.scene.perRoundFx.add(this.hitbox)

        if (this.scene.projectiles) {
            this.overlap = this.scene.physics.add.overlap(this.hitbox, this.scene.projectiles, this.onProjectileHit)
        }

        this.scene.events.on("update", this.update)
        EventBus.once("gamestate", this.onGameState)

        this.draw()
    }

    cleanup(): void {
        if (this.cleaned) return
        this.cleaned = true

        this.scene.events.off("update", this.update)
        EventBus.off("gamestate", this.onGameState)

        if (this.overlap) {
            try {
                this.overlap.destroy()
            } catch {}
            this.overlap = undefined
        }

        this.destroyRoundFx(this.graphic)
        this.destroyRoundFx(this.hitbox)

        this.onCleanup()
    }

    private isAlly(shooter: Creature): boolean {
        if (shooter.team === this.ownerTeam) return true

        const minions = (this.ownerTeam as unknown as { minions?: unknown }).minions
        return Boolean(minions) && shooter.team === minions
    }

    private draw(): void {
        const graphic = this.graphic
        graphic.clear()

        const pulse = 0.5 + 0.5 * Math.sin(this.scene.time.now * 0.006)
        const lastIndex = this.shieldCenters.length - 1

        this.shieldCenters.forEach((center, index) => {
            const frontBoost = index === lastIndex ? 1 : 0.8
            this.drawCrescent(center.x, center.y, (0.16 + pulse * 0.06) * frontBoost, (0.5 + pulse * 0.15) * frontBoost, 0.5 + pulse * 0.3)
        })
    }

    /** Draws a single crescent shield centered on (cx, cy), bulging toward the facing direction. */
    private drawCrescent(cx: number, cy: number, faceAlpha: number, rimAlpha: number, gemAlpha: number): void {
        const graphic = this.graphic
        const span = EDNO_SHIELD_WIDTH / 2
        const halfBulge = EDNO_SHIELD_BULGE / 2
        const innerBulge = EDNO_SHIELD_BULGE - EDNO_SHIELD_DEPTH

        graphic.save()
        graphic.translateCanvas(cx, cy)
        graphic.rotateCanvas(this.angle)

        graphic.fillStyle(SPECTRAL_FILL, faceAlpha)
        graphic.beginPath()

        for (let step = 0; step <= CRESCENT_STEPS; step++) {
            const s = -1 + (2 * step) / CRESCENT_STEPS
            const x = EDNO_SHIELD_BULGE * (1 - s * s) - halfBulge
            const y = s * span
            if (step === 0) graphic.moveTo(x, y)
            else graphic.lineTo(x, y)
        }

        for (let step = CRESCENT_STEPS; step >= 0; step--) {
            const s = -1 + (2 * step) / CRESCENT_STEPS
            const x = innerBulge * (1 - s * s) - halfBulge
            const y = s * span
            graphic.lineTo(x, y)
        }

        graphic.closePath()
        graphic.fillPath()

        graphic.lineStyle(4, SPECTRAL_RIM, rimAlpha * 0.45)
        graphic.strokePath()
        graphic.lineStyle(1.5, SPECTRAL_GOLD, rimAlpha)
        graphic.strokePath()

        const gemX = EDNO_SHIELD_BULGE - EDNO_SHIELD_DEPTH / 2 - halfBulge
        graphic.fillStyle(SPECTRAL_GEM, gemAlpha)
        graphic.fillCircle(gemX, 0, 3)

        graphic.restore()
    }

    private destroyRoundFx(object: Phaser.GameObjects.GameObject): void {
        this.scene.perRoundFx.remove(object)
        object.destroy()
    }
}

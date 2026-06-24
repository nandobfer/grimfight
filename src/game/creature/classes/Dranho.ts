import { Game } from "../../scenes/Game"
import { Creature } from "../Creature"
import { Character } from "../character/Character"
import {
    calculateDranhoAlliedAverageAp,
    calculateDranhoChannelDamage,
    DRANHO_CHANNEL_SELF_AP_RATIO,
    DRANHO_CHANNEL_TEAM_AP_RATIO,
    DRANHO_CHANNEL_TICK_MS,
} from "./DranhoChannel"

const maxAlliedApFlowSources = 5
const alliedApFlowParticlesPerSource = 3

export class Dranho extends Character {
    baseAttackSpeed = 0.45
    baseAttackDamage = 0
    baseAttackRange = 4
    baseMaxHealth = 260
    baseMaxMana = 0
    baseManaPerSecond = 0
    manaLocked = true

    abilityName = "Arcane Communion"

    private channelGraphic?: Phaser.GameObjects.Graphics
    private channelTickElapsed = 0
    private lastUpdateTime = 0
    private lastUpdateDelta = 0
    private channelTarget?: Creature

    constructor(scene: Game, id: string) {
        super(scene, "dranho", id)
        this.once("destroy", () => this.cleanupChannel())
    }

    override getAbilityDescription(): string {
        const alliedAverageAp = this.getAlliedAverageAbilityPowerExcludingSelf()
        const damage = calculateDranhoChannelDamage(this.abilityPower, alliedAverageAp)

        return `[primary.main:Passiva]: Dranho [warning.main:não ataca] nem conjura. Enquanto tiver um alvo válido em alcance, canaliza energia arcana continuamente, causando [info.main:${Math.round(
            damage
        )} (${Math.round(DRANHO_CHANNEL_SELF_AP_RATIO * 100)}% AP + ${Math.round(
            DRANHO_CHANNEL_TEAM_AP_RATIO * 100
        )}% da média de AP dos aliados)] de dano sombrio periodicamente.`
    }

    override castAbility(): false {
        return false
    }

    override landAttack(): void {}

    override withTargetUpdate(): void {
        if (!this.target?.active || !this.target.canBeTargeted) {
            this.cleanupChannel()
            this.newTarget()
            return
        }

        if (this.isInAttackRange()) {
            this.stopMoving()
            this.updateFacingDirection()
            this.channelTarget = this.target
            this.ensureChanneling()
            this.updateChannelDamage(this.target)
            this.drawChannelFx(this.target)
            return
        }

        this.cleanupChannel()
        if (!this.attacking && !this.moveLocked && !this.frozen) {
            this.moveToTarget()
            this.avoidOtherCharacters()
            this.emit("move", this)
        }
    }

    override refreshStats(): void {
        super.refreshStats()
        this.cleanupChannel()
        this.manaLocked = true
    }

    override update(time: number, delta: number): void {
        this.lastUpdateTime = time
        this.lastUpdateDelta = delta

        if (this.scene.state === "idle" || !this.active || this.health <= 0) {
            this.cleanupChannel()
        }

        super.update(time, delta)
    }

    private ensureChanneling(): void {
        if (!this.attackLocked || !this.moveLocked || !this.manaLocked) {
            this.startChanneling()
        }

        const animationKey = `${this.getAnimationTextureName()}-casting-${this.facing}`
        if (this.anims.currentAnim?.key !== animationKey) {
            this.play({ key: animationKey, frameRate: 8, repeat: -1 }, true)
        }

        if (!this.channelGraphic) {
            this.channelGraphic = this.scene.add.graphics().setDepth(this.depth + 8).setBlendMode(Phaser.BlendModes.ADD)
        }
    }

    private updateChannelDamage(target: Creature): void {
        if (this.channelTarget !== target) {
            this.channelTickElapsed = 0
            this.channelTarget = target
        }

        this.channelTickElapsed += this.lastUpdateDelta
        if (this.channelTickElapsed < DRANHO_CHANNEL_TICK_MS) return

        this.channelTickElapsed %= DRANHO_CHANNEL_TICK_MS

        const rawDamage = calculateDranhoChannelDamage(this.abilityPower, this.getAlliedAverageAbilityPowerExcludingSelf())
        const { value, crit } = this.calculateDamage(rawDamage)
        target.takeDamage(value, this, "dark", crit, true, this.abilityName)
    }

    private getAlliedAverageAbilityPowerExcludingSelf(): number {
        const alliedAbilityPowers = this.getActiveAlliesExcludingSelf().map((ally) => ally.abilityPower)

        return calculateDranhoAlliedAverageAp(alliedAbilityPowers)
    }

    private getActiveAlliesExcludingSelf(): Creature[] {
        if (!this.team) return []

        return this.team
            .getChildren(false, true)
            .filter((ally) => ally !== this && ally.active)
            .sort((a, b) => b.abilityPower - a.abilityPower)
    }

    private drawChannelFx(target: Creature): void {
        const graphic = this.channelGraphic
        if (!graphic) return

        graphic.clear()
        graphic.setDepth(Math.max(this.depth, target.depth) + 8)

        const time = this.lastUpdateTime
        const start = new Phaser.Math.Vector2(this.x, this.y - 18)
        const end = new Phaser.Math.Vector2(target.x, target.y - 18)
        const dx = end.x - start.x
        const dy = end.y - start.y
        const distance = Math.max(1, Math.hypot(dx, dy))
        const normalX = -dy / distance
        const normalY = dx / distance
        const pulse = (Math.sin(time * 0.012) + 1) * 0.5

        graphic.fillStyle(0x7c3aed, 0.14 + pulse * 0.08)
        graphic.fillCircle(this.x, this.y - 18, 14 + pulse * 3)
        graphic.lineStyle(2, 0xc4b5fd, 0.36 + pulse * 0.2)
        graphic.strokeCircle(this.x, this.y - 18, 9 + pulse * 4)

        this.drawAlliedApFlowFx(graphic, this.getActiveAlliesExcludingSelf(), time)

        for (let i = 0; i < 7; i++) {
            const orbit = time * 0.004 + i * 0.9
            const radius = 16 + Math.sin(time * 0.006 + i) * 5
            const gather = (Math.sin(time * 0.008 + i * 1.7) + 1) * 0.5
            const x = this.x + Math.cos(orbit) * radius * (1 - gather * 0.45)
            const y = this.y - 18 + Math.sin(orbit) * radius * 0.65 * (1 - gather * 0.45)
            graphic.fillStyle(i % 2 === 0 ? 0xddd6fe : 0x8b5cf6, 0.36 + gather * 0.34)
            graphic.fillCircle(x, y, 1.6 + gather * 1.3)
        }

        for (let i = 0; i < 5; i++) {
            const offset = (i - 2) * 9
            const jitter = Math.sin(time * 0.025 + i * 2.31) * 10
            const controlX = (start.x + end.x) * 0.5 + normalX * (offset + jitter)
            const controlY = (start.y + end.y) * 0.5 + normalY * (offset + jitter) - 22 - pulse * 10
            const alpha = 0.18 + pulse * 0.12 + i * 0.025

            this.drawArcBeam(graphic, start.x, start.y, controlX, controlY, end.x, end.y, 8, 0x4c1d95, alpha * 0.35)
            this.drawArcBeam(graphic, start.x, start.y, controlX, controlY, end.x, end.y, 4, 0x8b5cf6, alpha)
            this.drawArcBeam(graphic, start.x, start.y, controlX, controlY, end.x, end.y, 1.4, 0xf8f4ff, Math.min(0.92, alpha + 0.18))
        }
    }

    private drawAlliedApFlowFx(graphic: Phaser.GameObjects.Graphics, allies: Creature[], time: number): void {
        const destinationX = this.x
        const destinationY = this.y - 20
        const visibleAllies = allies.slice(0, maxAlliedApFlowSources)

        for (let allyIndex = 0; allyIndex < visibleAllies.length; allyIndex++) {
            const ally = visibleAllies[allyIndex]
            const sourceX = ally.x
            const sourceY = ally.y - 18
            const dx = destinationX - sourceX
            const dy = destinationY - sourceY
            const distance = Math.max(1, Math.hypot(dx, dy))
            const normalX = -dy / distance
            const normalY = dx / distance
            const arcOffset = Math.min(52, Math.max(18, distance * 0.18)) * (allyIndex % 2 === 0 ? 1 : -1)
            const controlX = (sourceX + destinationX) * 0.5 + normalX * arcOffset
            const controlY = (sourceY + destinationY) * 0.5 + normalY * arcOffset - 12

            graphic.lineStyle(1.2, 0x8b5cf6, 0.1)
            this.drawQuadraticPath(graphic, sourceX, sourceY, controlX, controlY, destinationX, destinationY, 7)

            for (let particleIndex = 0; particleIndex < alliedApFlowParticlesPerSource; particleIndex++) {
                const progress = (time * 0.00042 + allyIndex * 0.19 + particleIndex * 0.31) % 1
                const point = this.getQuadraticPoint(sourceX, sourceY, controlX, controlY, destinationX, destinationY, progress)
                const shimmer = (Math.sin(time * 0.018 + allyIndex * 1.7 + particleIndex * 2.2) + 1) * 0.5
                const alpha = 0.24 + progress * 0.46 + shimmer * 0.12
                const radius = 1.25 + progress * 1.35 + shimmer * 0.35

                graphic.fillStyle(0x4c1d95, alpha * 0.35)
                graphic.fillCircle(point.x, point.y, radius * 1.8)
                graphic.fillStyle(particleIndex % 2 === 0 ? 0xc4b5fd : 0x8b5cf6, alpha)
                graphic.fillCircle(point.x, point.y, radius)
                graphic.fillStyle(0xf8f4ff, Math.min(0.85, alpha + 0.12))
                graphic.fillCircle(point.x, point.y, Math.max(0.8, radius * 0.38))
            }
        }
    }

    private drawArcBeam(
        graphic: Phaser.GameObjects.Graphics,
        startX: number,
        startY: number,
        controlX: number,
        controlY: number,
        endX: number,
        endY: number,
        width: number,
        color: number,
        alpha: number
    ): void {
        graphic.lineStyle(width, color, alpha)
        this.drawQuadraticPath(graphic, startX, startY, controlX, controlY, endX, endY, 10)
    }

    private drawQuadraticPath(
        graphic: Phaser.GameObjects.Graphics,
        startX: number,
        startY: number,
        controlX: number,
        controlY: number,
        endX: number,
        endY: number,
        steps: number
    ): void {
        graphic.beginPath()
        graphic.moveTo(startX, startY)
        for (let i = 1; i <= steps; i++) {
            const point = this.getQuadraticPoint(startX, startY, controlX, controlY, endX, endY, i / steps)
            graphic.lineTo(point.x, point.y)
        }
        graphic.strokePath()
    }

    private getQuadraticPoint(
        startX: number,
        startY: number,
        controlX: number,
        controlY: number,
        endX: number,
        endY: number,
        progress: number
    ): { x: number; y: number } {
        const inverse = 1 - progress
        const inverseSquared = inverse * inverse
        const progressSquared = progress * progress

        return {
            x: inverseSquared * startX + 2 * inverse * progress * controlX + progressSquared * endX,
            y: inverseSquared * startY + 2 * inverse * progress * controlY + progressSquared * endY,
        }
    }

    private cleanupChannel(): void {
        if (this.attackLocked || this.moveLocked || this.manaLocked) {
            this.stopChanneling()
        }

        this.manaLocked = true
        this.channelTickElapsed = 0
        this.channelTarget = undefined

        if (this.channelGraphic) {
            this.channelGraphic.destroy()
            this.channelGraphic = undefined
        }
    }
}

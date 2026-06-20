import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    calculateRagnarosLavaRetaliationDamage,
    getRagnarosLavaConePoints,
    isPointInsideRagnarosLavaCone,
    RAGNAROS_LAVA_RETALIATION_COOLDOWN_MS,
    RAGNAROS_LAVA_RETALIATION_FX_DURATION_MS,
    RAGNAROS_LAVA_RETALIATION_RANGE,
} from "./RagnarosLavaRetaliation"

interface LavaDrip {
    angle: number
    radius: number
    speed: number
    size: number
    phase: number
}

export class Ragnaros extends Character {
    baseAttackSpeed = 0.75
    baseAttackDamage = 25
    baseMaxMana = 30
    baseMaxHealth = 400
    baseArmor = 10
    manaLocked = true

    abilityName = "Retaliação de Lava"

    private lastLavaRetaliationAt = Number.NEGATIVE_INFINITY
    private lavaGraphic?: Phaser.GameObjects.Graphics
    private lavaElapsed = 0
    private readonly lavaDrips: LavaDrip[] = []

    constructor(scene: Game, id: string) {
        super(scene, "ragnaros", id)
        this.createLavaFx()
    }

    override getAbilityDescription(): string {
        return `Ragnaros é um colosso flamejante de lava viva, moldado para segurar a linha de frente e punir quem ousa atacá-lo.

Passiva: ao receber dano em combate, Ragnaros cospe lava em um cone na direção do atacante, causando [error.main:${Math.round(
            calculateRagnarosLavaRetaliationDamage(this.abilityPower)
        )} (80% AP)] de dano de fogo aos inimigos atingidos. Esse efeito tem [primary.main:2 segundos] de recarga.

Cada erupção conta como uma conjuração contra o atacante, ativando Incendiary e outros efeitos que disparam quando Ragnaros conjura.`
    }

    override takeDamage(damage: number, attacker: Creature, type: Parameters<Creature["takeDamage"]>[2], crit = false, emit = true, source = "Attack") {
        const damageTaken = super.takeDamage(damage, attacker, type, crit, emit, source)

        if (damageTaken > 0) {
            this.tryLavaRetaliation(attacker)
        }

        return damageTaken
    }

    override refreshStats(): void {
        super.refreshStats()

        this.mana = 0
        this.manaLocked = true
        this.lastLavaRetaliationAt = Number.NEGATIVE_INFINITY
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
        this.updateLavaFx(delta)
    }

    private tryLavaRetaliation(attacker: Creature) {
        if (!this.active || !attacker?.active || !attacker.canBeTargeted) return
        if (this.scene.state !== "fighting") return

        const now = this.scene.time.now
        if (now - this.lastLavaRetaliationAt < RAGNAROS_LAVA_RETALIATION_COOLDOWN_MS) return

        this.lastLavaRetaliationAt = now
        this.triggerCastAgainst(attacker)
        this.releaseLavaCone(attacker)
    }

    private triggerCastAgainst(attacker: Creature) {
        const previousTarget = this.target

        this.target = attacker
        this.emit("cast")
        this.target = previousTarget
    }

    private releaseLavaCone(attacker: Creature) {
        const origin = this.getLavaOrigin()
        const angle = Phaser.Math.Angle.Between(origin.x, origin.y, attacker.x, attacker.y)
        const targets = this.getEnemyTeam()
            .getChildren(true, true)
            .filter(
                (target) =>
                    target.active &&
                    target.canBeTargeted &&
                    isPointInsideRagnarosLavaCone(origin, { x: target.x, y: target.y }, angle)
            )

        this.drawLavaConeFx(angle)

        for (const target of targets) {
            const { value, crit } = this.calculateDamage(calculateRagnarosLavaRetaliationDamage(this.abilityPower))
            target.takeDamage(value, this, "fire", crit, true, this.abilityName)
        }
    }

    private getLavaOrigin() {
        return { x: this.x, y: this.y - 14 }
    }

    private drawLavaConeFx(angle: number) {
        const graphic = this.scene.add.graphics().setDepth(this.depth + 9).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(graphic)

        let cleaned = false
        let tween: Phaser.Tweens.Tween | undefined

        const cleanup = () => {
            if (cleaned) return
            cleaned = true

            this.scene.events.off("gamestate", stopFx)
            graphic.destroy(true)
        }
        const stopFx = () => tween?.stop()

        tween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: RAGNAROS_LAVA_RETALIATION_FX_DURATION_MS,
            ease: "Sine.easeOut",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => {
                const progress = activeTween.getValue() as number
                this.drawLavaConeFrame(graphic, angle, progress)
            },
            onComplete: cleanup,
            onStop: cleanup,
        })

        this.scene.events.once("gamestate", stopFx)
    }

    private drawLavaConeFrame(graphic: Phaser.GameObjects.Graphics, angle: number, progress: number) {
        const easedProgress = Phaser.Math.Easing.Cubic.Out(progress)
        const range = RAGNAROS_LAVA_RETALIATION_RANGE * easedProgress
        const alpha = Phaser.Math.Clamp(1 - progress, 0, 1)
        const points = getRagnarosLavaConePoints(this.getLavaOrigin(), angle, range, undefined, 14)

        graphic.clear()
        graphic.fillStyle(0xff5a00, 0.22 * alpha)
        graphic.beginPath()
        graphic.moveTo(points[0].x, points[0].y)

        for (const point of points.slice(1)) {
            graphic.lineTo(point.x, point.y)
        }

        graphic.closePath()
        graphic.fillPath()
        graphic.lineStyle(3, 0xffd166, 0.42 * alpha)
        graphic.strokePath()

        for (let index = 2; index < points.length; index += 3) {
            const point = points[index]
            graphic.fillStyle(0xfff0a3, 0.5 * alpha)
            graphic.fillCircle(point.x, point.y, 3 + 5 * alpha)
        }
    }

    private createLavaFx() {
        this.lavaGraphic = this.scene.add.graphics().setDepth(this.depth + 7).setBlendMode(Phaser.BlendModes.ADD)

        for (let index = 0; index < 16; index++) {
            this.lavaDrips.push({
                angle: Phaser.Math.FloatBetween(0, Math.PI * 2),
                radius: Phaser.Math.FloatBetween(10, 25),
                speed: Phaser.Math.FloatBetween(0.35, 0.85),
                size: Phaser.Math.FloatBetween(1.8, 4.4),
                phase: Phaser.Math.FloatBetween(0, 1),
            })
        }

        this.drawLavaFx()
    }

    private updateLavaFx(delta: number) {
        if (!this.lavaGraphic?.active) return

        this.lavaElapsed += delta
        this.drawLavaFx()
    }

    private drawLavaFx() {
        if (!this.lavaGraphic?.active) return

        this.lavaGraphic.clear()

        if (!this.active) return

        this.lavaGraphic.setDepth(this.depth + 7)

        const timeSeconds = this.lavaElapsed / 1000
        const baseY = this.y - 34

        this.lavaGraphic.fillStyle(0xff4d00, 0.18)
        this.lavaGraphic.fillEllipse(this.x, this.y + 22, 44, 11)

        for (const drip of this.lavaDrips) {
            const progress = (timeSeconds * drip.speed + drip.phase) % 1
            const sway = Math.sin(timeSeconds * 3 + drip.phase * Math.PI * 2) * 3
            const x = this.x + Math.cos(drip.angle) * drip.radius + sway
            const y = baseY + progress * 64
            const alpha = Phaser.Math.Clamp(0.9 - progress * 0.75, 0.08, 0.85)
            const size = drip.size * (1 - progress * 0.35)

            this.lavaGraphic.fillStyle(0xff3100, alpha * 0.28)
            this.lavaGraphic.fillCircle(x, y + 2, size * 1.9)
            this.lavaGraphic.fillStyle(0xff7a00, alpha)
            this.lavaGraphic.fillCircle(x, y, size)
            this.lavaGraphic.fillStyle(0xffe066, alpha * 0.75)
            this.lavaGraphic.fillCircle(x - size * 0.2, y - size * 0.25, size * 0.38)
        }
    }

    override destroy(fromScene?: boolean): void {
        this.lavaGraphic?.destroy(true)
        this.lavaGraphic = undefined
        this.lavaDrips.length = 0

        super.destroy(fromScene)
    }
}

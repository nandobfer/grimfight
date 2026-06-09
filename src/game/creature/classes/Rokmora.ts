import { Heal } from "../../fx/Heal"
import { Arrow } from "../../objects/Projectile/Arrow"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    calculateRokmoraArcherDamage,
    calculateRokmoraChaliceHealingPerAlly,
    calculateRokmoraDragonShield,
    getNextRokmoraConstellation,
    ROKMORA_CHALICE_TICK_MS,
    ROKMORA_CONSTELLATION_DURATION_MS,
    RokmoraConstellation,
} from "./RokmoraConstellations"

const archerJumpRange = 180

const constellationColors: Record<RokmoraConstellation, number> = {
    archer: 0x8a6cff,
    dragon: 0xcd7f32,
    chalice: 0x88ffbb,
}

const constellationStars = [
    { angle: 0, radiusX: 28, radiusY: 10, size: 4.5 },
    { angle: 0.86, radiusX: 40, radiusY: 15, size: 3.5 },
    { angle: 1.92, radiusX: 32, radiusY: 12, size: 5 },
    { angle: 2.74, radiusX: 46, radiusY: 18, size: 3 },
    { angle: 3.88, radiusX: 34, radiusY: 13, size: 4 },
    { angle: 4.86, radiusX: 43, radiusY: 16, size: 3.5 },
]

export class Rokmora extends Character {
    baseAttackSpeed = 0.75
    baseAttackDamage = 30
    baseMaxMana = 0
    baseMaxHealth = 500
    manaLocked = true

    abilityName = "Círculo das Estrelas"

    private activeConstellation: RokmoraConstellation = "archer"
    private constellationElapsed = 0
    private chaliceElapsed = 0
    private constellationGraphic?: Phaser.GameObjects.Graphics
    private constellationOrbitTween?: Phaser.Tweens.Tween
    private constellationPulseTween?: Phaser.Tweens.Tween
    private constellationFx = { orbit: 0, pulse: 0 }

    constructor(scene: Game, id: string) {
        super(scene, "rokmora", id)
        this.createConstellationFx()
    }

    override getAbilityDescription(): string {
        return `Rokmora é um golias de pedra, andarilho e eremita, que lê o céu para manter o equilíbrio da natureza. Sob suas mãos antigas, os pequenos e indefesos encontram abrigo.

Passiva: Rokmora navega por constelações durante o combate. Cada constelação dura [primary.main:2 segundos].

        [primary.main:Constelação do Arqueiro]: cada ataque dispara uma flecha estelar a partir de Rokmora contra um inimigo próximo do alvo atual, causando [info.main:${Math.round(
            calculateRokmoraArcherDamage(this.maxHealth, this.abilityPower)
        )} (10% vida máxima + 50% AP)] de dano radiante.

[primary.main:Constelação do Dragão]: ao receber dano, ganha escudo equivalente ao dano recebido multiplicado por sua armadura atual. Com [primary.main:${Math.round(
            this.armor
        )}%] de armadura, cada golpe recebido gera [success.main:${Math.round(Math.max(0, this.armor))}%] do dano como escudo.

        [primary.main:Constelação da Taça]: a cada segundo, uma aura verde suave emana de Rokmora. Ela distribui [success.main:${Math.round(
            this.maxHealth * 0.1
        )} (20% da vida máxima)] de cura entre todos os aliados feridos, incluindo Rokmora.`
    }

    override landAttack() {
        const currentTarget = this.target

        super.landAttack()

        if (this.activeConstellation === "archer" && currentTarget?.active && this.active) {
            this.fireStarArrow(currentTarget)
        }
    }

    private fireStarArrow(originTarget: Creature) {
        const target = this.getStarArrowTarget(originTarget)
        if (!target) return

        const arrow = new Arrow(this.scene, this.x, this.y, this)
        arrow.setTint(0x9f7bff)
        arrow.setScale(0.065, 0.065)
        arrow.addLightEffect({
            color: 0x7f6cff,
            radius: 42,
            intensity: 3.5,
            minRadius: 24,
            maxRadius: 58,
            minIntensity: 1.5,
            maxIntensity: 4.5,
            duration: 420,
        })
        arrow.alreadyOverlaped.add(originTarget)
        arrow.onHit = (enemy) => {
            const damage = calculateRokmoraArcherDamage(this.maxHealth, this.abilityPower)
            enemy.takeDamage(damage, this, "holy", false, true, this.abilityName)
            this.onHit(enemy)
            arrow.destroy()
        }
        arrow.fire(target, this.x, this.y)
    }

    private getStarArrowTarget(originTarget: Creature) {
        const candidates = originTarget
            .getAlliesInRange(archerJumpRange)
            .filter((enemy) => enemy.active && enemy !== originTarget)
            .sort((a, b) => Phaser.Math.Distance.Between(originTarget.x, originTarget.y, a.x, a.y) - Phaser.Math.Distance.Between(originTarget.x, originTarget.y, b.x, b.y))

        return candidates[0]
    }

    override takeDamage(damage: number, attacker: Creature, type: Parameters<Creature["takeDamage"]>[2], crit = false, emit = true, source = "Attack") {
        const damageTaken = super.takeDamage(damage, attacker, type, crit, emit, source)

        if (this.active && this.activeConstellation === "dragon" && damageTaken > 0) {
            const shield = calculateRokmoraDragonShield(damageTaken, this.armor)
            if (shield > 0) {
                this.gainShield(shield, { healer: this, source: this.abilityName })
            }
        }

        return damageTaken
    }

    override refreshStats(): void {
        super.refreshStats()

        this.maxMana = 0
        this.mana = 0
        this.manaLocked = true
        this.activeConstellation = "archer"
        this.constellationElapsed = 0
        this.chaliceElapsed = 0
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
        this.drawConstellationFx()

        if (this.scene.state !== "fighting" || !this.active) return

        if (this.activeConstellation === "chalice") {
            this.chaliceElapsed += delta
            while (this.chaliceElapsed >= ROKMORA_CHALICE_TICK_MS) {
                this.chaliceElapsed -= ROKMORA_CHALICE_TICK_MS
                this.emitChaliceAura()
            }
        }

        this.constellationElapsed += delta
        while (this.constellationElapsed >= ROKMORA_CONSTELLATION_DURATION_MS) {
            this.constellationElapsed -= ROKMORA_CONSTELLATION_DURATION_MS
            this.activeConstellation = getNextRokmoraConstellation(this.activeConstellation)
            this.chaliceElapsed = 0
        }
    }

    private createConstellationFx() {
        this.constellationGraphic = this.scene.add.graphics().setDepth(this.depth + 8).setBlendMode(Phaser.BlendModes.ADD)

        this.constellationOrbitTween = this.scene.tweens.add({
            targets: this.constellationFx,
            orbit: Math.PI * 2,
            duration: 5200,
            repeat: -1,
            ease: "Linear",
        })

        this.constellationPulseTween = this.scene.tweens.add({
            targets: this.constellationFx,
            pulse: 1,
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        })

        this.drawConstellationFx()
    }

    private drawConstellationFx() {
        if (!this.constellationGraphic?.active) return

        this.constellationGraphic.clear()

        if (!this.active) return

        const color = constellationColors[this.activeConstellation]
        const centerX = this.x
        const centerY = this.y - 58
        const pulse = this.constellationFx.pulse
        const alpha = 0.45 + pulse * 0.45
        const lineAlpha = 0.12 + pulse * 0.16

        this.constellationGraphic.setDepth(this.depth + 8)
        this.constellationGraphic.lineStyle(1, color, lineAlpha)

        let previousX = 0
        let previousY = 0

        for (let index = 0; index < constellationStars.length; index++) {
            const star = constellationStars[index]
            const angle = star.angle + this.constellationFx.orbit
            const x = centerX + Math.cos(angle) * star.radiusX
            const y = centerY + Math.sin(angle) * star.radiusY
            const size = star.size + pulse * 1.7

            if (index > 0) {
                this.constellationGraphic.lineBetween(previousX, previousY, x, y)
            }

            this.constellationGraphic.fillStyle(color, alpha * 0.22)
            this.constellationGraphic.fillCircle(x, y, size * 2.25)
            this.constellationGraphic.fillStyle(0xffffff, alpha)
            this.constellationGraphic.fillCircle(x, y, size * 0.42)
            this.constellationGraphic.lineStyle(1.5, color, alpha)
            this.constellationGraphic.beginPath()
            this.constellationGraphic.moveTo(x - size, y)
            this.constellationGraphic.lineTo(x + size, y)
            this.constellationGraphic.moveTo(x, y - size)
            this.constellationGraphic.lineTo(x, y + size)
            this.constellationGraphic.strokePath()

            previousX = x
            previousY = y
        }
    }

    private cleanupConstellationFx() {
        if (this.constellationOrbitTween) {
            this.constellationOrbitTween.stop()
            this.scene.tweens.remove(this.constellationOrbitTween)
            this.constellationOrbitTween = undefined
        }

        if (this.constellationPulseTween) {
            this.constellationPulseTween.stop()
            this.scene.tweens.remove(this.constellationPulseTween)
            this.constellationPulseTween = undefined
        }

        this.constellationGraphic?.destroy(true)
        this.constellationGraphic = undefined
    }

    private emitChaliceAura() {
        const woundedAllies = this.team.getChildren(true, true).filter((ally) => ally.active && ally.health < ally.maxHealth)
        const healing = calculateRokmoraChaliceHealingPerAlly(this.maxHealth, woundedAllies.length)

        this.drawChaliceAura()

        if (healing <= 0) return

        for (const ally of woundedAllies) {
            new Heal(ally)
            ally.heal(healing, { healer: this, source: this.abilityName })
        }
    }

    private drawChaliceAura() {
        const graphic = this.scene.add.graphics().setDepth(this.depth + 4).setBlendMode(Phaser.BlendModes.ADD)
        const maxRadius = 165
        const duration = 650
        let cleaned = false

        const cleanup = () => {
            if (cleaned) return
            cleaned = true
            this.scene.events.off("gamestate", stopAura)
            graphic.destroy(true)
        }
        const stopAura = () => tween.stop()

        const tween = this.scene.tweens.addCounter({
            from: 10,
            to: maxRadius,
            duration,
            ease: "Sine.easeOut",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => {
                const radius = activeTween.getValue() as number
                const alpha = Phaser.Math.Clamp(1 - radius / maxRadius, 0.08, 0.55)

                graphic.clear()
                graphic.lineStyle(10, 0x88ffbb, alpha)
                graphic.strokeCircle(this.x, this.y, radius)
                graphic.lineStyle(2, 0xd9ffe8, alpha * 0.75)
                graphic.strokeCircle(this.x, this.y, radius * 0.72)
            },
            onComplete: cleanup,
            onStop: cleanup,
        })

        this.scene.events.once("gamestate", stopAura)
    }

    override destroy(fromScene?: boolean): void {
        this.cleanupConstellationFx()
        super.destroy(fromScene)
    }
}

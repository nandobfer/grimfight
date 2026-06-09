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

    constructor(scene: Game, id: string) {
        super(scene, "rokmora", id)
    }

    override getAbilityDescription(): string {
        return `Rokmora é um golias de pedra, andarilho e eremita, que lê o céu para manter o equilíbrio da natureza. Sob suas mãos antigas, os pequenos e indefesos encontram abrigo.

Passiva: Rokmora navega por constelações durante o combate. Cada constelação dura [primary.main:2 segundos].

[primary.main:Constelação do Arqueiro]: cada ataque dispara uma flecha estelar a partir do alvo atual contra um inimigo próximo, causando [info.main:${Math.round(
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

        const arrow = new Arrow(this.scene, originTarget.x, originTarget.y, this)
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
        arrow.fire(target, originTarget.x, originTarget.y)
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
            this.glowForConstellation()
        }
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

    private glowForConstellation() {
        const color = this.activeConstellation === "archer" ? 0x8a6cff : this.activeConstellation === "dragon" ? 0xcd7f32 : 0x88ffbb
        this.glowTemporarily(color, 6, 650)
    }
}

import { Heal } from "../../fx/Heal"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    calculateRokmoraArcherDamage,
    calculateRokmoraChaliceHealingPerAlly,
    calculateRokmoraDragonShield,
    getNextRokmoraConstellation,
    ROKMORA_ARCHER_STAR_DELAY_MS,
    ROKMORA_CHALICE_TICK_MS,
    ROKMORA_CONSTELLATION_DURATION_MS,
    RokmoraConstellation,
} from "./RokmoraConstellations"

interface ConstellationStarDefinition {
    angle: number
    radiusX: number
    radiusY: number
    size: number
}

interface OrbitingArcherStar extends ConstellationStarDefinition {
    id: number
    target: Creature
    timer?: Phaser.Time.TimerEvent
}

const constellationColors: Record<RokmoraConstellation, number> = {
    archer: 0x8a6cff,
    dragon: 0xcd7f32,
    chalice: 0x88ffbb,
}

function interpolateColor(from: number, to: number, progress: number) {
    const amount = Phaser.Math.Clamp(progress, 0, 1)
    const fromRed = (from >> 16) & 0xff
    const fromGreen = (from >> 8) & 0xff
    const fromBlue = from & 0xff
    const toRed = (to >> 16) & 0xff
    const toGreen = (to >> 8) & 0xff
    const toBlue = to & 0xff

    const red = Math.round(Phaser.Math.Linear(fromRed, toRed, amount))
    const green = Math.round(Phaser.Math.Linear(fromGreen, toGreen, amount))
    const blue = Math.round(Phaser.Math.Linear(fromBlue, toBlue, amount))

    return (red << 16) | (green << 8) | blue
}

const archerStarProjectileSpeed = 500
const archerStarHitboxSize = 18
const archerStarAngleOffset = 0.92

const constellationStars: ConstellationStarDefinition[] = [
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
    private constellationTransitionTween?: Phaser.Tweens.Tween
    private constellationFx = { orbit: 0, pulse: 0, transition: 1 }
    private constellationColorFrom = constellationColors.archer
    private constellationColorTo = constellationColors.archer
    private constellationOrbitDirection = 1
    private orbitingArcherStars: OrbitingArcherStar[] = []
    private nextOrbitingArcherStarId = 0

    constructor(scene: Game, id: string) {
        super(scene, "rokmora", id)
        this.createConstellationFx()
    }

    override getAbilityDescription(): string {
        return `Rokmora é um golias de pedra, andarilho e eremita, que lê o céu para manter o equilíbrio da natureza. Sob suas mãos antigas, os pequenos e indefesos encontram abrigo.

Passiva: Rokmora navega por constelações enquanto está ativa. Cada constelação dura [primary.main:2 segundos].

        [primary.main:Constelação do Arqueiro]: cada ataque adiciona uma estrela à constelação. Após um breve intervalo, ela se desprende e avança brilhando contra o alvo atual, causando [info.main:${Math.round(
            calculateRokmoraArcherDamage(this.maxHealth, this.abilityPower)
        )} (10% vida máxima + 50% AP)] de dano radiante.

[primary.main:Constelação do Dragão]: ao receber dano, ganha escudo equivalente ao dano pré-mitigação multiplicado por sua armadura atual. Com [primary.main:${Math.round(
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

    private fireStarArrow(target: Creature) {
        if (!target.active) return

        const star = this.createOrbitingArcherStar(target)
        star.timer = this.scene.time.delayedCall(ROKMORA_ARCHER_STAR_DELAY_MS, () => {
            star.timer = undefined
            this.releaseOrbitingArcherStar(star)
        })
    }

    override takeDamage(damage: number, attacker: Creature, type: Parameters<Creature["takeDamage"]>[2], crit = false, emit = true, source = "Attack") {
        const incomingDamage = Math.max(0, damage)
        const damageTaken = super.takeDamage(damage, attacker, type, crit, emit, source)

        if (this.active && this.activeConstellation === "dragon" && incomingDamage > 0) {
            const shield = calculateRokmoraDragonShield(incomingDamage, this.armor)
            if (shield > 0) {
                this.gainShield(shield, { healer: this, source: this.abilityName })
            }
        }

        return damageTaken
    }

    override refreshStats(): void {
        super.refreshStats()

        this.clearOrbitingArcherStars()
        this.maxMana = 0
        this.mana = 0
        this.manaLocked = true
        this.activeConstellation = "archer"
        this.constellationElapsed = 0
        this.chaliceElapsed = 0
        this.constellationFx.transition = 1
        this.constellationColorFrom = constellationColors.archer
        this.constellationColorTo = constellationColors.archer
        this.constellationOrbitDirection = 1
        this.restartConstellationOrbitTween()
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
        this.drawConstellationFx()

        if (!this.active) return

        this.constellationElapsed += delta
        while (this.constellationElapsed >= ROKMORA_CONSTELLATION_DURATION_MS) {
            this.constellationElapsed -= ROKMORA_CONSTELLATION_DURATION_MS
            this.advanceConstellation()
        }

        if (this.scene.state !== "fighting") return

        if (this.activeConstellation === "chalice") {
            this.chaliceElapsed += delta
            while (this.chaliceElapsed >= ROKMORA_CHALICE_TICK_MS) {
                this.chaliceElapsed -= ROKMORA_CHALICE_TICK_MS
                this.emitChaliceAura()
            }
        }
    }

    private createConstellationFx() {
        this.constellationGraphic = this.scene.add.graphics().setDepth(this.depth + 8).setBlendMode(Phaser.BlendModes.ADD)

        this.restartConstellationOrbitTween()

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

    private advanceConstellation() {
        const nextConstellation = getNextRokmoraConstellation(this.activeConstellation)
        this.activeConstellation = nextConstellation
        this.chaliceElapsed = 0
        this.constellationOrbitDirection *= -1
        this.restartConstellationOrbitTween()
        this.animateConstellationTransition(nextConstellation)
    }

    private animateConstellationTransition(nextConstellation: RokmoraConstellation) {
        this.stopConstellationTransitionTween()
        this.constellationColorFrom = this.getCurrentConstellationColor()
        this.constellationColorTo = constellationColors[nextConstellation]
        this.constellationFx.transition = 0

        this.constellationTransitionTween = this.scene.tweens.add({
            targets: this.constellationFx,
            transition: 1,
            duration: 420,
            ease: "Sine.easeInOut",
            onComplete: () => {
                this.constellationColorFrom = this.constellationColorTo
                this.constellationFx.transition = 1
                this.constellationTransitionTween = undefined
            },
        })
    }

    private getCurrentConstellationColor() {
        return interpolateColor(this.constellationColorFrom, this.constellationColorTo, this.constellationFx.transition)
    }

    private restartConstellationOrbitTween() {
        this.stopConstellationOrbitTween()

        this.constellationOrbitTween = this.scene.tweens.add({
            targets: this.constellationFx,
            orbit: this.constellationFx.orbit + Math.PI * 2 * this.constellationOrbitDirection,
            duration: 5200,
            repeat: -1,
            ease: "Linear",
        })
    }

    private createOrbitingArcherStar(target: Creature): OrbitingArcherStar {
        const lastStar = this.orbitingArcherStars.length > 0 ? this.orbitingArcherStars[this.orbitingArcherStars.length - 1] : constellationStars[constellationStars.length - 1]
        const star: OrbitingArcherStar = {
            id: ++this.nextOrbitingArcherStarId,
            target,
            angle: lastStar.angle + archerStarAngleOffset,
            radiusX: 46,
            radiusY: 18,
            size: 4.4,
        }

        this.orbitingArcherStars.push(star)
        return star
    }

    private releaseOrbitingArcherStar(star: OrbitingArcherStar) {
        this.removeOrbitingArcherStar(star)

        if (!this.active || !star.target.active || this.scene.state !== "fighting") return

        const position = this.getConstellationStarPosition(star)
        this.launchArcherStarProjectile(star.target, position.x, position.y, star.size)
    }

    private removeOrbitingArcherStar(star: OrbitingArcherStar) {
        star.timer?.remove(false)
        star.timer = undefined
        this.orbitingArcherStars = this.orbitingArcherStars.filter((candidate) => candidate !== star)
    }

    private clearOrbitingArcherStars() {
        for (const star of this.orbitingArcherStars) {
            star.timer?.remove(false)
            star.timer = undefined
        }
        this.orbitingArcherStars = []
    }

    private getConstellationStarPosition(star: ConstellationStarDefinition) {
        const angle = star.angle + this.constellationFx.orbit
        return {
            x: this.x + Math.cos(angle) * star.radiusX,
            y: this.y - 28 + Math.sin(angle) * star.radiusY,
        }
    }

    private launchArcherStarProjectile(target: Creature, x: number, y: number, size: number) {
        const hitbox = this.scene.add.zone(x, y, archerStarHitboxSize, archerStarHitboxSize)
        const starGraphic = this.scene.add.graphics().setPosition(x, y).setDepth(this.depth + 10).setBlendMode(Phaser.BlendModes.ADD)
        const color = this.getCurrentConstellationColor()
        const light = this.scene.lights.addLight(x, y, 48, color, 3.5)
        let cleaned = false
        let spinTween: Phaser.Tweens.Tween | undefined
        let pulseTween: Phaser.Tweens.Tween | undefined
        let lifespanTimer: Phaser.Time.TimerEvent | undefined
        let overlap: Phaser.Physics.Arcade.Collider | undefined
        let wallCollider: Phaser.Physics.Arcade.Collider | undefined

        this.drawConstellationStar(starGraphic, 0, 0, size * 1.25, color, 1)
        this.scene.perRoundFx.add(hitbox)
        this.scene.perRoundFx.add(starGraphic)
        this.scene.physics.add.existing(hitbox)

        const body = (hitbox as Phaser.GameObjects.Zone & { body?: Phaser.Physics.Arcade.Body }).body
        if (!body) {
            hitbox.destroy(true)
            starGraphic.destroy(true)
            this.scene.lights.removeLight(light)
            return
        }

        body.allowGravity = false
        body.setCircle(archerStarHitboxSize / 2)

        const cleanup = (destroyHitbox = true, destroyGraphic = true) => {
            if (cleaned) return
            cleaned = true

            this.scene.events.off("update", updateProjectile)
            this.scene.events.off("gamestate", cleanup)
            target.off("destroy", cleanup)
            overlap?.destroy()
            wallCollider?.destroy()
            lifespanTimer?.remove(false)
            lifespanTimer = undefined

            if (spinTween) {
                spinTween.stop()
                this.scene.tweens.remove(spinTween)
                spinTween = undefined
            }
            if (pulseTween) {
                pulseTween.stop()
                this.scene.tweens.remove(pulseTween)
                pulseTween = undefined
            }

            this.scene.lights.removeLight(light)
            if (destroyHitbox && hitbox.active) hitbox.destroy(true)
            if (destroyGraphic && starGraphic.active) starGraphic.destroy(true)
        }
        const hitTarget = () => {
            if (cleaned || !target.active || !this.active) {
                cleanup()
                return
            }

            const damage = calculateRokmoraArcherDamage(this.maxHealth, this.abilityPower)
            target.takeDamage(damage, this, "holy", false, true, this.abilityName)
            this.onHit(target)
            cleanup()
        }
        const updateProjectile = () => {
            if (!hitbox.active || !starGraphic.active) {
                cleanup()
                return
            }

            starGraphic.setPosition(hitbox.x, hitbox.y)
            light.setPosition(hitbox.x, hitbox.y)
        }

        spinTween = this.scene.tweens.add({ targets: starGraphic, duration: 120, angle: 360, repeat: -1, yoyo: false })
        pulseTween = this.scene.tweens.add({ targets: light, radius: 64, intensity: 5, duration: 260, yoyo: true, repeat: -1, ease: "Sine.easeInOut" })
        overlap = this.scene.physics.add.overlap(hitbox, target, hitTarget)
        wallCollider = this.scene.physics.add.collider(hitbox, this.scene.walls, () => cleanup())
        lifespanTimer = this.scene.time.delayedCall(2200, () => cleanup())
        hitbox.once("destroy", () => cleanup(false, true))
        starGraphic.once("destroy", () => cleanup(true, false))
        this.scene.events.on("update", updateProjectile)
        this.scene.events.once("gamestate", cleanup)
        target.once("destroy", cleanup)

        const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y)
        this.scene.physics.velocityFromRotation(angle, archerStarProjectileSpeed, body.velocity)
    }

    private drawConstellationFx() {
        if (!this.constellationGraphic?.active) return

        this.constellationGraphic.clear()

        if (!this.active) return

        const color = this.getCurrentConstellationColor()
        const pulse = this.constellationFx.pulse
        const transitionFlare = Math.sin(this.constellationFx.transition * Math.PI)
        const alpha = 0.45 + pulse * 0.45 + transitionFlare * 0.18
        const lineAlpha = 0.12 + pulse * 0.16 + transitionFlare * 0.1

        this.constellationGraphic.setDepth(this.depth + 8)
        this.constellationGraphic.lineStyle(1, color, lineAlpha)

        let previousX = 0
        let previousY = 0

        for (let index = 0; index < constellationStars.length; index++) {
            const star = constellationStars[index]
            const position = this.getConstellationStarPosition(star)
            const x = position.x
            const y = position.y
            const size = star.size + pulse * 1.7 + transitionFlare * 1.2

            if (index > 0) {
                this.constellationGraphic.lineBetween(previousX, previousY, x, y)
            }

            this.drawConstellationStar(this.constellationGraphic, x, y, size, color, alpha)

            previousX = x
            previousY = y
        }

        for (const star of this.orbitingArcherStars) {
            const position = this.getConstellationStarPosition(star)
            const x = position.x
            const y = position.y
            const size = star.size + pulse * 1.7 + transitionFlare * 1.2

            this.constellationGraphic.lineBetween(previousX, previousY, x, y)
            this.drawConstellationStar(this.constellationGraphic, x, y, size, color, alpha)

            previousX = x
            previousY = y
        }
    }

    private drawConstellationStar(graphic: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number, alpha: number) {
        graphic.fillStyle(color, alpha * 0.22)
        graphic.fillCircle(x, y, size * 2.25)
        graphic.fillStyle(0xffffff, alpha)
        graphic.fillCircle(x, y, size * 0.42)
        graphic.lineStyle(1.5, color, alpha)
        graphic.beginPath()
        graphic.moveTo(x - size, y)
        graphic.lineTo(x + size, y)
        graphic.moveTo(x, y - size)
        graphic.lineTo(x, y + size)
        graphic.strokePath()
    }

    private cleanupConstellationFx() {
        this.clearOrbitingArcherStars()
        this.stopConstellationOrbitTween()

        this.stopConstellationTransitionTween()

        if (this.constellationPulseTween) {
            this.constellationPulseTween.stop()
            this.scene.tweens.remove(this.constellationPulseTween)
            this.constellationPulseTween = undefined
        }

        this.constellationGraphic?.destroy(true)
        this.constellationGraphic = undefined
    }

    private stopConstellationOrbitTween() {
        if (!this.constellationOrbitTween) return

        this.constellationOrbitTween.stop()
        this.scene.tweens.remove(this.constellationOrbitTween)
        this.constellationOrbitTween = undefined
    }

    private stopConstellationTransitionTween() {
        if (!this.constellationTransitionTween) return

        this.constellationTransitionTween.stop()
        this.scene.tweens.remove(this.constellationTransitionTween)
        this.constellationTransitionTween = undefined
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

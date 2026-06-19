import { MagicShieldFx } from "../../fx/MagicShieldFx"
import { Snowball } from "../../objects/Projectile/Snowball"
import { Freeze } from "../../objects/StatusEffect/Freeze"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

const protectiveFrostDuration = 1800
const protectiveFrostImpactProgress = 0.5
const protectiveFrostShieldApRatio = 0.45
const protectiveFrostFreezeDuration = 2000

export class Jacrost extends Character {
    baseAttackSpeed = 0.5
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 140
    baseMaxHealth = 220

    abilityName = "Geada Protetora"

    constructor(scene: Game, id: string) {
        super(scene, "jacrost", id)
    }

    override refreshStats(): void {
        super.refreshStats()
        this.gainMana(this.maxMana * 0.8)
    }

    override getAbilityDescription(): string {
        return `Sends protective frost across the board. Midway through the storm, allies gain a shield for [success.main:${Math.round(
            this.abilityPower * protectiveFrostShieldApRatio
        )} (45% AP)] that can critically shield, and enemies are frozen for [info.main:2 seconds].`
    }

    override landAttack(): void {
        if (!this.target || !this.active) return

        new Snowball(this.scene, this.x, this.y, this).fire(this.target)
    }

    override castAbility(): void {
        this.casting = true
        this.moveLocked = true

        this.drawProtectiveFrost(() => this.applyProtectiveFrost())
    }

    private applyProtectiveFrost(): void {
        if (!this.active) return

        for (const ally of this.team.getChildren(true, true)) {
            if (!ally.active) continue

            const { value } = this.calculateDamage(this.abilityPower * protectiveFrostShieldApRatio)
            ally.gainShield(value, { healer: this, source: this.abilityName })
            new MagicShieldFx(this.scene, ally.x, ally.y, 0.3)
        }

        for (const enemy of this.getEnemyTeam().getChildren(true, true)) {
            if (!enemy.active) continue
            new Freeze(enemy, this, protectiveFrostFreezeDuration).start()
        }
    }

    private drawProtectiveFrost(onImpact: () => void): void {
        const graphic = this.scene.add.graphics().setDepth(this.depth + 8).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(graphic)

        const bounds = this.scene.background.getBounds()
        let impacted = false
        let cleaned = false
        let tween: Phaser.Tweens.Tween | undefined

        const stopFrost = () => tween?.stop()
        const cleanup = () => {
            if (cleaned) return
            cleaned = true

            this.scene.events.off("gamestate", stopFrost)
            this.off("died", stopFrost)
            this.off("destroy", stopFrost)
            graphic.destroy(true)

            this.moveLocked = false
            this.casting = false
        }

        tween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: protectiveFrostDuration,
            ease: "Sine.easeInOut",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => {
                const progress = activeTween.getValue() as number
                this.drawProtectiveFrostFrame(graphic, bounds, progress)

                if (!impacted && progress >= protectiveFrostImpactProgress) {
                    impacted = true
                    onImpact()
                }
            },
            onComplete: cleanup,
            onStop: cleanup,
        })

        this.scene.events.once("gamestate", stopFrost)
        this.once("died", stopFrost)
        this.once("destroy", stopFrost)
    }

    private drawProtectiveFrostFrame(graphic: Phaser.GameObjects.Graphics, bounds: Phaser.Geom.Rectangle, progress: number): void {
        const sweep = bounds.left - 160 + (bounds.width + 320) * progress
        const fadeIn = Phaser.Math.Clamp(progress / 0.25, 0, 1)
        const fadeOut = Phaser.Math.Clamp((1 - progress) / 0.25, 0, 1)
        const alpha = Math.min(fadeIn, fadeOut)

        graphic.clear()

        for (let i = 0; i < 6; i++) {
            const y = bounds.top + bounds.height * (0.2 + i * 0.12)
            const wave = Math.sin(progress * Math.PI * 4 + i * 0.75) * 18
            const x1 = sweep - 230 - i * 18
            const x2 = sweep + 120 + i * 12

            graphic.lineStyle(12 - i, 0xbff6ff, alpha * (0.16 + i * 0.025))
            graphic.lineBetween(x1, y + wave, x2, y - wave * 0.4)
            graphic.lineStyle(2, 0xffffff, alpha * 0.32)
            graphic.lineBetween(x1 + 24, y + wave - 8, x2 - 16, y - wave * 0.4 - 8)
        }

        for (let i = 0; i < 20; i++) {
            const snowProgress = (progress * 1.35 + i * 0.071) % 1
            const x = bounds.left + bounds.width * snowProgress
            const y = bounds.top + ((i * 47) % Math.max(1, bounds.height))
            const radius = 1.4 + (i % 4) * 0.45

            graphic.fillStyle(i % 3 === 0 ? 0xffffff : 0xcdf7ff, alpha * 0.75)
            graphic.fillCircle(x, y + Math.sin(progress * Math.PI * 6 + i) * 10, radius)
        }

        if (progress >= protectiveFrostImpactProgress - 0.08 && progress <= protectiveFrostImpactProgress + 0.08) {
            const pulse = 1 - Math.abs(progress - protectiveFrostImpactProgress) / 0.08
            graphic.fillStyle(0xdffbff, pulse * 0.12)
            graphic.fillRect(bounds.left, bounds.top, bounds.width, bounds.height)
        }
    }
}

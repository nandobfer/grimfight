import { Fireball } from "../../objects/Projectile/Fireball"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import { calculateYueFireRayDamage, YUE_FIRE_RAY_DURATION_MS } from "./YueFireRay"

export class Yue extends Character {
    baseAttackSpeed = 0.5
    baseAttackRange = 5
    baseManaPerSecond = 10
    baseMaxMana = 30
    baseMaxHealth = 200

    abilityName = "Fire Ray"

    constructor(scene: Game, id: string) {
        super(scene, "yue", id)
    }

    override getAbilityDescription(): string {
        return `Draws a fire ray to a random enemy over [warning.main:${YUE_FIRE_RAY_DURATION_MS}ms], then deals [info.main:${Math.round(
            calculateYueFireRayDamage(this.abilityPower)
        )} (125% AP)] fire damage.`
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 1, 6)
        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    override landAttack() {
        if (!this.target || !this.active) return

        const fireball = new Fireball(this.scene, this.x, this.y, this)
        fireball.fire(this.target)
    }

    override castAbility(multiplier = 1): void {
        const target = this.pickFireRayTarget()
        if (!target) {
            this.target = undefined
            return
        }

        this.casting = true
        this.target = target
        this.updateFacingDirection()

        this.drawFireRay(target, () => {
            if (!target.active || !this.active) return

            const { value, crit } = this.calculateDamage(calculateYueFireRayDamage(this.abilityPower, multiplier))
            target.takeDamage(value, this, "fire", crit, true, this.abilityName)
        })
    }

    private pickFireRayTarget(): Creature | undefined {
        const enemies = this.getEnemyTeam()
            .getChildren(true, true)
            .filter((enemy) => enemy.active && enemy.canBeTargeted)

        return enemies.length > 0 ? RNG.pick(enemies) : undefined
    }

    private drawFireRay(target: Creature, onComplete: () => void) {
        const graphic = this.scene.add.graphics().setDepth(this.depth + 6).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(graphic)

        let cleaned = false
        let tween: Phaser.Tweens.Tween | undefined
        let lightTween: Phaser.Tweens.Tween | undefined
        let light: Phaser.GameObjects.Light | undefined

        if (this.scene.lights) {
            light = this.scene.lights.addLight(this.x, this.y - 18, 150, 0xff6600, 1)
            lightTween = this.scene.tweens.add({
                targets: light,
                radius: { from: 80, to: 120 },
                intensity: { from: 3, to: 4 },
                duration: 300,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            })
        }

        const cleanup = (destroyGraphic = true) => {
            if (cleaned) return
            cleaned = true

            this.scene.events.off("gamestate", stopRay)

            if (tween) {
                tween.stop()
                this.scene.tweens.remove(tween)
                tween = undefined
            }

            if (lightTween) {
                lightTween.stop()
                this.scene.tweens.remove(lightTween)
                lightTween = undefined
            }

            if (light) {
                this.scene.lights.removeLight(light)
                light = undefined
            }

            if (destroyGraphic && graphic.active) {
                graphic.destroy(true)
            }

            this.casting = false
        }

        const stopRay = () => cleanup()
        graphic.once("destroy", () => cleanup(false))

        tween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: YUE_FIRE_RAY_DURATION_MS,
            ease: "Sine.easeInOut",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => {
                const progress = activeTween.getValue() as number
                const startX = this.x
                const startY = this.y - 18
                const endX = target.x
                const endY = target.y - 18
                const rayEndX = Phaser.Math.Linear(startX, endX, progress)
                const rayEndY = Phaser.Math.Linear(startY, endY, progress)

                graphic.clear()
                graphic.lineStyle(16, 0xff3300, 0.25)
                graphic.strokeLineShape(new Phaser.Geom.Line(startX, startY, rayEndX, rayEndY))
                graphic.lineStyle(8, 0xffaa00, 0.85)
                graphic.strokeLineShape(new Phaser.Geom.Line(startX, startY, rayEndX, rayEndY))
                graphic.lineStyle(3, 0xffffcc, 0.95)
                graphic.strokeLineShape(new Phaser.Geom.Line(startX, startY, rayEndX, rayEndY))

                light?.setPosition(rayEndX, rayEndY)
            },
            onComplete: () => {
                onComplete()
                cleanup()
            },
            onStop: () => cleanup(),
        })

        this.scene.events.once("gamestate", stopRay)
    }
}

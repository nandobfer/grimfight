import { Game } from "../../scenes/Game"
import { DarkCleave } from "../../objects/Projectile/DarkCleave"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import { calculateCloverDarkCleaveDamage, CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET, pickCloverDarkCleaveAngle } from "./CloverDarkCleave"

export class Clover extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 28
    baseAttackRange = 1
    baseMaxHealth = 360
    baseArmor = 5
    baseMaxMana = 90
    baseManaPerSecond = 8
    baseManaPerAttack = 12

    abilityName = "Dark Cleave"
    private finishCast?: () => void

    constructor(scene: Game, id: string) {
        super(scene, "clover", id)
    }

    override getAbilityDescription(): string {
        return `Clover swings his greatsword, launching a [primary.main:Dark Cleave] toward his target. The blade pierces every enemy in its path, dealing [error.main:${Math.round(
            calculateCloverDarkCleaveDamage(this.attackDamage)
        )} (200% AD)] dark damage to each enemy hit, and shatters against the arena wall.`
    }

    override castAbility(multiplier = 1): boolean | void {
        const target = this.getDarkCleaveTarget()
        if (!target || this.scene.state !== "fighting") return false

        this.finishCast?.()
        this.casting = true
        this.target = target
        this.updateFacingDirection()
        this.setVelocity(0)
        this.playCastingAnimation()
        const origin = { x: this.x, y: this.y - 18 }
        const angle = pickCloverDarkCleaveAngle(origin, { x: target.x, y: target.y - 14 },
            Phaser.Math.FloatBetween(-CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET, CLOVER_DARK_CLEAVE_MAX_ANGLE_OFFSET))
        new DarkCleave(this.scene, this, origin, angle, multiplier)
    }

    override withTargetUpdate(): void {
        if (this.casting) {
            this.stopMoving()
            return
        }
        super.withTargetUpdate()
    }

    private getDarkCleaveTarget(): Creature | undefined {
        if (this.target?.active && this.target.canBeTargeted) return this.target
        this.newTarget()
        if (this.target?.active && this.target.canBeTargeted) return this.target
        const target = this.getClosestEnemy()
        if (target?.active && target.canBeTargeted) return target
        this.target = undefined
        return undefined
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        // Stop the previous attack before installing the cast's stop listener.
        this.anims.stop()
        const scene = this.scene
        const finish = () => {
            this.off(`animationcomplete-${key}`, finish)
            this.off("animationstop", finish)
            this.off("died", finish)
            this.off("destroy", finish)
            scene.events.off("gamestate", finish)
            scene.events.off(Phaser.Scenes.Events.SHUTDOWN, finish)
            this.casting = false
            this.finishCast = undefined
        }
        this.finishCast = finish
        this.once(`animationcomplete-${key}`, finish)
        this.once("animationstop", finish)
        this.once("died", finish)
        this.once("destroy", finish)
        scene.events.once("gamestate", finish)
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, finish)
        this.play({ key, frameRate: 14, repeat: 0 }, true)
        if (!this.anims.isPlaying) finish()
    }
}

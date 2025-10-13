import { FrostStrike } from "../../fx/FrostStrike"
import { LightParams } from "../../fx/FxSprite"
import { IceSpike } from "../../fx/IceSpike"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"

export class Lalatina extends Character {
    baseAttackSpeed = 0.75
    baseAttackDamage = 30
    baseMaxMana: number = 80
    baseMaxHealth: number = 500

    abilityName: string = "Holy Shield"

    castsCount = 0

    private light?: Phaser.GameObjects.Light

    constructor(scene: Game, id: string) {
        super(scene, "lalatina", id)

    }

    override getAbilityDescription(): string {
        return `Passive: Steals [primary.main:10%] of all damage dealt.

1st cast: Strikes the current target with a frost strike, dealing [error.main:${Math.round(
            this.attackDamage * 2 + this.abilityPower * 0.3
        )} (200% AD)] [info.main: (30% AP)] damage.
2nd cast: Strikes the area in front of you, dealing [error.main:${Math.round(
            this.attackDamage + this.abilityPower * 0.3
        )} (100% AD)] [info.main: (30% AP)] damage to hit enemies.
3rd cast: Summons pillars of ice under up to 3 enemies, dealing [error.main:${Math.round(
            this.attackDamage * 0.75 + this.abilityPower * 0.3
        )} (75% AD)] [info.main: (30% AP)] damage to each one.`
    }


    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 4
        const attacking = this.extractAnimationsFromSpritesheet("attacking", 1, 5, 6, "lalatina_attacking")

        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if (attacking.find((anim) => anim.key === animation.key)) {
                this.setOrigin(0.5, 0.6)
                this.body.setOffset(64, 64) 
            } else {
                this.setOrigin(0.5, 0.75)
                this.body.setOffset(0, 0) 
            }
        }

        this.on("animationstart", onUpdate)
        this.once("destroy", () => this.off("animationstart", onUpdate))
    }

    override castAbility(): void {
        if (!this.target) {
            return
        }

        this.casting = true
        this.castsCount += 1

        try {
            switch (this.castsCount) {
                case 1:
                    const damage = (this.attackDamage * 2 + this.abilityPower * 0.3) / 2
                    new FrostStrike(this, this.target, damage, 0.5)
                    this.scene.time.delayedCall(500, () => {
                        if (this.target) new FrostStrike(this, this.target, damage, 0.5)
                    })
                    break
                case 2:
                    new FrostStrike(this, this.target, this.attackDamage + this.abilityPower * 0.3, 1.4)
                    break
                case 3:
                    const targets = 3
                    const enemies = this.target.team.getChildren(true, true)
                    for (let i = 1; i <= targets; i++) {
                        const iceSpikesDamage = this.calculateDamage(this.attackDamage * 0.75 + this.abilityPower * 0.3)
                        const target = RNG.pick(enemies)
                        new IceSpike(this.scene || target.scene, target)
                        target.takeDamage(iceSpikesDamage.value, this, "cold", iceSpikesDamage.crit, true, this.abilityName)
                    }

                    this.castsCount = 0
                    break
            }
        } catch (error) {}

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()
        this.castsCount = 0
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
    }
}

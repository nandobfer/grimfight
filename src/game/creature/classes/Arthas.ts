import { FrostStrike } from "../../fx/FrostStrike"
import { LightParams } from "../../fx/FxSprite"
import { IceSpike } from "../../fx/IceSpike"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"

export class Arthas extends Character {
    baseAttackSpeed = 0.75
    baseAttackDamage = 30
    baseMaxMana: number = 80
    baseMaxHealth: number = 425
    baseLifesteal: number = 10

    abilityName: string = "Golpe Gélido"

    castsCount = 0

    private light?: Phaser.GameObjects.Light

    constructor(scene: Game, id: string) {
        super(scene, "arthas", id)
        this.addLightEffect({
            color: 0x66ddff,
            intensity: 1,
            radius: 64,
            duration: 300,
        })
    }

    override getAbilityDescription(): string {
        return `Passivo: Rouba [primary.main:10%] de todo dano causado.
1º lançamento: Atinge o alvo atual com um golpe gélido causando [error.main:${Math.round(
            this.attackDamage * 2 + this.abilityPower * 0.3
        )} (200% AD)] [info.main: (30% AP)] de dano.
2º lançamento: Golpeia a área a sua frente causando [error.main:${Math.round(
            this.attackDamage + this.abilityPower * 0.3
        )} (100% AD)] [info.main: (30% AP)] de dano aos inimigos atingidos.
3º lançamento: Invoca pilares de gelo embaixo de até 3 inimigos, causando [error.main:${Math.round(
            this.attackDamage * 0.75 + this.abilityPower * 0.3
        )} (75% AD)] [info.main: (30% AP)] de dano a cada um.`
    }

    addLightEffect(lightParams: LightParams) {
        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(this.x, this.y, lightParams.radius, lightParams.color, lightParams.intensity)

            this.scene.tweens.add({
                targets: this.light,
                radius: { from: lightParams.minRadius, to: lightParams.maxRadius },
                intensity: { from: lightParams.minIntensity, to: lightParams.maxIntensity },
                duration: lightParams.duration,
                yoyo: lightParams.yoyo ?? true,
                repeat: lightParams.repeat ?? -1,
                ease: "Sine.easeInOut",
            })

            const handleUpdate = () => {
                if (this.active && this.light) {
                    this.light.setPosition(this.x, this.y)
                }
            }
            this.scene.events.on("update", handleUpdate)
            this.once("destroy", () => {
                this.scene.events.off("update", handleUpdate)
                if (this.light) this.scene.lights?.removeLight(this.light)
            })
        }
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 4
        const attacking = this.extractAnimationsFromSpritesheet("attacking", 1, 5, 6, "arthas_attacking")

        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if (attacking.find((anim) => anim.key === animation.key)) {
                this.setOrigin(0.5, 0.6)
            } else {
                this.setOrigin(0.5, 0.75)
            }
        }

        this.on("animationstart", onUpdate)
        this.once("destroy", () => this.off("animationstart", onUpdate))
    }

    override castAbility(): void {
        this.casting = true
        this.castsCount += 1

        if (!this.target) {
            return
        }

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
                        target.takeDamage(iceSpikesDamage.value, this, "cold", iceSpikesDamage.crit)
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

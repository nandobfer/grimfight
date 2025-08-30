import { FrostStrike } from "../../fx/FrostStrike"
import { IceSpike } from "../../fx/IceSpike"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"

export class Arthas extends Character {
    baseAttackSpeed = 0.75
    baseSpeed = 80
    baseAttackDamage = 30
    baseMaxMana: number = 80
    baseMaxHealth: number = 425
    baseAbilityPower: number = 15
    baseLifesteal: number = 10

    abilityName: string = "Golpe Gélido"

    castsCount = 0

    constructor(scene: Game, id: string) {
        super(scene, "arthas", id)
    }

    override getAbilityDescription(): string {
        return `Passivo: Rouba [primary.main:10%] de todo dano causado.
1º lançamento: Atinge o alvo atual com um golpe gélido causando [error.main:${
            this.attackDamage * 2 + this.abilityPower
        } (200% AD)] [info.main: (100% AP)] de dano.
2º lançamento: Golpeia a área a sua frente causando [error.main:${
            this.attackDamage + this.abilityPower
        } (100% AD)] [info.main: (100% AP)] de dano aos inimigos atingidos.
3º lançamento: Invoca pilares de gelo embaixo de até 3 inimigos, causando [error.main:${
            this.attackDamage * 0.75 + this.abilityPower
        } (75% AD)] [info.main: (100% AP)] de dano a cada um.`
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 4
        const attacking = this.extractAnimationsFromSpritesheet("attacking", 1, 5, 6, "arthas_attacking")

        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if (attacking.find((anim) => anim.key === animation.key)) {
                this.setOffset(this.width / 4, this.height / 4)
            } else {
                this.setOffset(0, 0)
            }
        }

        this.on("animationstart", onUpdate)
    }

    override castAbility(): void {
        this.casting = true
        this.castsCount += 1

        if (!this.target) {
            return
        }

        switch (this.castsCount) {
            case 1:
                const damage = (this.attackDamage * 2 + this.abilityPower) / 2
                new FrostStrike(this, this.target, damage, 0.5)
                this.scene.time.delayedCall(500, () => {
                    if (this.target) new FrostStrike(this, this.target, damage, 0.5)
                })
                break
            case 2:
                new FrostStrike(this, this.target, this.attackDamage + this.abilityPower, 1.4)
                break
            case 3:
                const targets = 3
                const enemies = this.target.team.getChildren(true, true)
                for (let i = 1; i <= targets; i++) {
                    const iceSpikesDamage = this.calculateDamage(this.attackDamage * 0.75 + this.abilityPower)
                    const target = RNG.pick(enemies)
                    new IceSpike(this.scene || target.scene, target)
                    target.takeDamage(iceSpikesDamage.value, this, "cold", iceSpikesDamage.crit)
                }

                this.castsCount = 0
                break
        }

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

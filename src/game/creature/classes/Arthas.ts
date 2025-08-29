import { IceSpike } from "../../fx/IceSpike"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"

export class Arthas extends Character {
    baseAttackSpeed = 0.75
    baseSpeed = 80
    baseAttackDamage = 35
    baseMaxMana: number = 60
    baseMaxHealth: number = 425
    baseAbilityPower: number = 20
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

    // override extractAttackingAnimation() {
    //     this.attackAnimationImpactFrame = 3
    //     const attacking = this.extractAnimationsFromSpritesheet("attacking2", 1, 5, 13, "statikk_attacking")
    //     const specialAttacking = this.extractAnimationsFromSpritesheet("attacking1", 52, 6, 13, "statikk_attacking")

    //     console.log(this.width / 2, this.height / 2)
    //     const onUpdate = (animation: Phaser.Animations.Animation) => {
    //         if ([...attacking, ...specialAttacking].find((anim) => anim.key === animation.key)) {
    //             this.setOffset(this.width / 4, this.height / 4)
    //         } else {
    //             this.setOffset(0, 0)
    //         }
    //     }

    //     this.on("animationstart", onUpdate)
    // }

    override castAbility(): void {
        this.casting = true
        this.castsCount += 1

        if (!this.target) {
            return
        }

        let damage = this.calculateDamage(this.attackDamage * 2 + this.abilityPower)
        switch (this.castsCount) {
            case 1:
                this.target.takeDamage(damage.value, this, "cold", damage.crit)
                break
            case 2:
                damage = this.calculateDamage(this.attackDamage + this.abilityPower)
                // todo: cold slash FX with overlap
                break
            case 3:
                const targets = 3
                const enemies = this.target.team.getChildren(true, true)
                for (let i = 1; i <= targets; i++) {
                    damage = this.calculateDamage(this.attackDamage * 0.75 + this.abilityPower)
                    const target = RNG.pick(enemies)
                    new IceSpike(this.scene || target.scene, target.x, target.y, target.scale * 0.5)
                    target.takeDamage(damage.value, this, "cold", damage.crit)
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

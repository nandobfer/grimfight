import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"

export class Rukia extends Character {
    baseAttackSpeed = 1.5
    baseSpeed = 130
    baseAttackDamage = 15
    baseCritChance = 20

    abilityName: string = "Lâminas Gélidas"

    abilityAttacksCount = 5

    constructor(scene: Game, id: string) {
        super(scene, "rukia", id)
        this.setTint(0x6666ff)
    }

    override getAbilityDescription(): string {
        return `Passivo: Ataques causam [info.main:${Math.round(this.abilityPower * 0.01)}]
        
Rapidamente avança atacando um inimigo aleatório [warning.main:${this.abilityAttacksCount} vezes], causando [error.main:${Math.round(
            this.attackDamage
        )} (100%AD)] + [info.main:${Math.round(this.abilityPower * 0.01)} (10% AP)] a cada ataque.`
    }

    override castAbility(): void {
        this.casting = true

        const originalTarget = this.target
        const enemies = this.scene.enemyTeam.getChildren(true, true)

        const dashDuration = (to: { x: number; y: number }) => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, to.x, to.y)
            const pxPerSec = 1800 // tune this “speed”
            return Phaser.Math.Clamp((dist / pxPerSec) * 1000, 90, 180)
        }

        const returnToTarget = () => {
            this.casting = false
            const target = originalTarget?.randomPointAround()
            if (target) {
                this.scene.tweens.add({
                    targets: this,
                    x: target.x,
                    y: target.y,
                    repeat: 0,
                    ease: "Sine.easeOut",
                    duration: dashDuration(target),
                })
            }
        }

        const tweenChain = this.scene.tweens.chain({
            targets: this,
            tweens: [],
            paused: true,
            onComplete: () => returnToTarget(),
            onStop: () => returnToTarget(),
        })

        for (let count = 1; count <= this.abilityAttacksCount; count++) {
            const target = RNG.pick(enemies)
            if (!target) continue

            const position = target.randomPointAround()
            tweenChain.add([
                {
                    targets: this,
                    duration: dashDuration(position),
                    repeat: 0,
                    yoyo: false,
                    x: position.x,
                    y: position.y,
                    ease: "Expo.easeOut",
                    onComplete: () => {
                        const physicalDamage = this.calculateDamage(this.attackDamage)
                        const coldDamage = this.calculateDamage(this.abilityPower * 0.1)
                        target.takeDamage(physicalDamage.value, this, "normal", physicalDamage.crit)
                        target.takeDamage(coldDamage.value, this, "cold", physicalDamage.crit)
                    },
                },
            ])
        }

        tweenChain.play()
    }

    override refreshStats(): void {
        super.refreshStats()
    }
}

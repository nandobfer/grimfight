import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 500
    baseArmor = 5
    baseResistance = 10
    baseAttackDamage = 13
    baseMaxMana = 100

    constructor(scene: Game, id: string) {
        super(scene, "knight", id)
    }

    castAbility(): void {
        this.casting = true
        const originalManaPerAttack = this.manaPerAttack
        const originalManaPerSecond = this.manaPerSecond

        this.manaPerAttack = 0
        this.manaPerSecond = 0

        this.scene.tweens.add({
            targets: this,
            duration: 5000,
            armor: this.armor * 5,
            yoyo: true,
            repeat: 0,
            onComplete: () => {
                this.manaPerAttack = originalManaPerAttack
                this.manaPerSecond = originalManaPerSecond
            },
        })
        this.casting = false
    }
}

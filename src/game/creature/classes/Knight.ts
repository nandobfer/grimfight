import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 500
    baseArmor = 5
    baseResistance = 10
    baseAttackDamage = 13
    baseMaxMana = 110

    constructor(scene: Game, id: string) {
        super(scene, "knight", id)
    }

    castAbility(): void {
        this.casting = true
        // const { damage: healing, crit } = this.calculateDamage(this.maxHealth * 0.1 + this.abilityPower)
        // this.heal(healing, crit)

        this.scene.tweens.add({
            targets: this,
            duration: 3500,
            armor: this.armor * 5,
            yoyo: true,
            repeat: 0,
            onComplete: () => {},
        })
        this.casting = false
    }
}

import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 425
    baseArmor = 7
    baseResistance = 10
    baseAttackDamage = 13
    baseMaxMana = 90

    constructor(scene: Game, id: string) {
        super(scene, "knight", id)
    }

    castAbility(): void {
        this.casting = true

        const duration = 2500

        const originalManaPerAttack = this.manaPerAttack
        const originalManaPerSecond = this.manaPerSecond

        this.manaPerAttack = 0
        this.manaPerSecond = 0
        this.aura = this.postFX.addGlow(0xffffff, 0)

        this.scene.tweens.add({
            targets: this.aura,
            duration,
            yoyo: true,
            repeat: 0,
            outerStrength: { from: 0, to: 2 },
            onComplete: () => {
                this.removeAura()
            },
        })

        this.scene.tweens.add({
            targets: this,
            duration,
            armor: this.armor * 10,
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

import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 425
    baseArmor = 7
    baseResistance = 10
    baseAttackDamage = 13
    baseMaxMana = 90

    abilityName = "Levantar escudo"

    constructor(scene: Game, id: string) {
        super(scene, "knight", id)
    }

    override getAbilityDescription(): string {
        return `Ao longo de 2.5 segundos, ganha armadura progressivamente, atingindo um máximo de [warning.main:${Math.round(
            this.armor * 10
        )} (10x Armor)], que decai ao longo da mesma duração.`
    }

    castAbility(): void {
        this.casting = true

        const duration = 2500
        this.manaLocked = true

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
                this.manaLocked = false
            },
        })
        this.casting = false
    }
}

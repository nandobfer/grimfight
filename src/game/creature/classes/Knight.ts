import { MagicShieldFx } from "../../fx/MagicShieldFx"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 425
    baseArmor = 7
    baseResistance = 10
    baseAttackDamage = 15
    baseMaxMana = 90

    abilityName = "Levantar escudo"

    constructor(scene: Game, id: string) {
        super(scene, "maximus", id)
    }

    override getAbilityDescription(): string {
        return `Ao longo de 2.5 segundos, ganha armadura progressivamente, atingindo um máximo de [warning.main:${Math.round(
            this.armor * 10
        )} (10x Armor)], que decai ao longo da mesma duração.`
    }

    castAbility(): void {
        this.casting = true

        const duration = 1500
        this.manaLocked = true

        const animation = new MagicShieldFx(this.scene, this.x, this.y, 0.4)

        this.scene.tweens.add({
            targets: this,
            duration,
            armor: this.armor * 10,
            yoyo: true,
            repeat: 0,
            onUpdate: () => {
                if (animation && animation.active) {
                    animation.setPosition(this.x, this.y)
                }
            },
            onComplete: () => {
                this.manaLocked = false
                animation.finish()
            },
        })
        this.casting = false
    }
}

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
        return `Recebe um escudo que absorve [success.main:${Math.round(
            this.level * 50 + this.maxHealth * 0.1
        )}][primary.main: (50x level)] + [success.main:(10% HP)] de dano.`
    }

    castAbility(): void {
        this.casting = true

        new MagicShieldFx(this.scene, this.x, this.y, 0.4)
        this.gainShield(this.level * 50 + this.maxHealth * 0.1)

        this.casting = false
    }
}

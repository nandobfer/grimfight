import { MagicShieldFx } from "../../fx/MagicShieldFx"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Knight extends Character {
    baseMaxHealth = 425
    baseArmor = 10
    baseAttackDamage = 15
    baseMaxMana = 120

    abilityName = "Raise Shield"

    constructor(scene: Game, id: string) {
        super(scene, "maximus", id)
    }

    override getAbilityDescription(): string {
        return `Gains a shield that absorbs [success.main:${Math.round(
            this.abilityPower + this.maxHealth * 0.1
        )}][info.main: (100% AP)] + [success.main:(10% HP)] damage.`
    }

    castAbility(): void {
        this.casting = true

        new MagicShieldFx(this.scene, this.x, this.y, 0.4)
        this.gainShield(this.abilityPower + this.maxHealth * 0.1, { healer: this, source: this.abilityName })
        this.manaLocked = true
        this.once("shield-broken", () => {
            this.manaLocked = false
        })

        this.casting = false
    }
}

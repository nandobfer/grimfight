import { Blizzard } from "../../fx/Blizzard"
import { IceShard } from "../../objects/Projectile/IceShard"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Sorcerer extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 15
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 150
    baseMaxHealth = 300

    abilityName: string = "Nevasca"

    constructor(scene: Game, id: string) {
        super(scene, "jadis", id)
    }

    override getAbilityDescription(): string {
        return `Inimigos atingidos pela nevasca recebem [info.main:${Math.round(
            this.abilityPower * 0.75 * 5
        )} (375% AP)] de dano ao longo de 2 segundos e são [primary.main:congelados].`
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 1, 6)
        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    override landAttack() {
        if (!this.target || !this?.active) return

        const iceshard = new IceShard(this.scene, this.x, this.y, this)
        iceshard.fire(this.target)
    }

    override castAbility(multiplier = 1): void {
        if (!this.target) {
            return
        }

        this.casting = true

        this.startChanneling()
        const blizzard = new Blizzard(this, this.target, this.abilityPower * 0.5 * multiplier, 2, 3500, 1500)

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()
        this.manaLocked = false
        this.attackLocked = false
    }
}

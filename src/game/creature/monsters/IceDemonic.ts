import { Blizzard } from "../../fx/Blizzard"
import { IceShard } from "../../objects/Projectile/IceShard"
import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class IceDemonic extends Monster {
    baseMaxHealth = 2500
    baseAttackDamage = 40
    baseAttackSpeed = 1
    baseAttackRange = 3
    baseMaxMana = 150
    baseManaPerAttack = 0
    baseManaPerSecond = 20

    constructor(scene: Game) {
        super(scene, "ice_demonic")
        this.preferredPosition = "back"
        this.attackAnimationImpactFrame = 9
        this.challengeRating = this.calculateCR()
        this.setTint(0x6666ff)
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking", 208, 13)
    }

    override landAttack(target = this.target) {
        if (!target || !this.active) return

        const iceshard = new IceShard(this.scene, this.x, this.y, this)
        iceshard.fire(target)
    }

    override castAbility(): void {
        if (!this.target) return

        this.casting = true

        this.attackLocked = true
        this.manaLocked = true
        const blizzard = new Blizzard(this, this.target, this.abilityPower * 0.5, 1.5, 2000, 1000)
        blizzard.setTint(this.tint)

        this.casting = false
    }
}

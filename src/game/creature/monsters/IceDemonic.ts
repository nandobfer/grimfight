import { Blizzard } from "../../fx/Blizzard"
import { IceShard } from "../../objects/IceShard"
import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

export class IceDemonic extends Monster {
    baseMaxHealth = 2000
    baseAttackDamage = 50
    baseAttackSpeed = 0.75
    baseAttackRange = 3
    baseMaxMana = 150
    baseManaPerAttack = 0
    baseManaPerSecond = 20

    constructor(scene: Game) {
        super(scene, "ice_demonic")
        this.preferredPosition = "back"
        this.attackAnimationImpactFrame = 9
        this.challengeRating = this.calculateCR()
        this.setTint(0x0000ff)
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking", 208, 13)
    }

    override landAttack(target = this.target) {
        if (!target || !this.active) return

        const iceshard = new IceShard(this)
        iceshard.fire(target)
    }

    override castAbility(): void {
        if (!this.target) return

        this.casting = true

        this.manaLocked = true
        const blizzard = new Blizzard(this, this.target, this.abilityPower * 0.5, 2, 1500)

        this.casting = false
    }
}

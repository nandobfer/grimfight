import { Blizzard } from "../../fx/Blizzard"
import { IceShard } from "../../objects/IceShard"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Sorcerer extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 15
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 150
    baseMaxHealth = 300

    constructor(scene: Game, id: string) {
        super(scene, "sorcerer", id)
        this.attackAnimationImpactFrame = 6
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 1, 6)
        this.extractAnimationsFromSpritesheet("attacking2", 1, 6)

        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    // levelUp(): void {
    //     super.levelUp()

    //     this.baseAttackDamage += 10
    // }

    override landAttack() {
        if (!this.target) return

        const iceshard = new IceShard(this)
        iceshard.fire(this.target)
    }

    override castAbility(): void {
        if (!this.target) {
            return
        }

        this.casting = true

        const blizzard = new Blizzard(this, this.target, this.abilityPower * 0.5, 2)

        this.casting = false
    }
}

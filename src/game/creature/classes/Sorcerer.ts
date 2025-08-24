import { Explosion } from "../../fx/Explosion"
import { Fireball } from "../../objects/Fireball"
import { IceShard } from "../../objects/IceShard"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Sorcerer extends Character {
    baseAttackSpeed = 0.75
    baseAttackDamage = 15
    baseAttackRange = 5
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
        this.casting = false

    }

}

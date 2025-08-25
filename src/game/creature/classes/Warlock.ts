import { Fireball } from "../../objects/Fireball"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { MonsterRegistry } from "../monsters/MonsterRegistry"

export class Warlock extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 15
    baseAttackRange = 2
    baseManaPerSecond = 10
    baseMaxMana = 150
    baseMaxHealth = 300
    baseArmor: number = 5

    constructor(scene: Game, id: string) {
        super(scene, "warlock", id)
        this.attackAnimationImpactFrame = 6
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 1, 6)
        this.extractAnimationsFromSpritesheet("attacking2", 1, 6)

        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    override landAttack() {
        if (!this.target) return

        const fireball = new Fireball(this)
        fireball.setTint(0x0000ff)
        fireball.fire(this.target)
    }

    override castAbility(): void {
        this.casting = true

        const skeleton = MonsterRegistry.create("skeleton", this.scene)
        skeleton.master = this
        this.team.minions.add(skeleton)

        skeleton.setPosition(this.x, this.y)
        skeleton.setScale(0.7)
        skeleton.addAura(0x00ff66, 1)
        skeleton.baseSpeed = this.baseSpeed
        skeleton.baseAttackDamage += this.abilityPower * 0.08
        skeleton.baseMaxHealth += this.abilityPower
        skeleton.reset()
        skeleton.target = this.target

        this.casting = false
    }

    override reset(): void {
        super.reset()

        this.mana = this.maxMana * 0.65
    }
}

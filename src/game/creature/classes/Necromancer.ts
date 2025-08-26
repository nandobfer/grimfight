import { MagicCircleFx } from "../../fx/MagicCircleFx"
import { Deathbolt } from "../../objects/Deathbolt"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { MonsterRegistry } from "../monsters/MonsterRegistry"

export class Necromancer extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 15
    baseAttackRange = 2
    baseManaPerSecond = 10
    baseMaxMana = 150
    baseMaxHealth = 300
    baseArmor: number = 5
    baseAbilityPower: number = 50

    abilityDescription: string = "Sumona um esqueletinho para lutar ao seu lado até a morte, ba dum ts"

    constructor(scene: Game, id: string) {
        super(scene, "necromancer", id)
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 9
        this.extractAnimationsFromSpritesheet("attacking", 208, 13)
        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    override landAttack() {
        if (!this.target) return

        const deathbolt = new Deathbolt(this)

        deathbolt.fire(this.target)
    }

    override castAbility(): void {
        this.casting = true

        const skeleton = MonsterRegistry.create("skeleton", this.scene)
        skeleton.master = this
        this.team.minions.add(skeleton)
        const { x, y } = this.randomPointAround(true)
        const fx = new MagicCircleFx(this.scene, x, y)
        skeleton.teleportTo(x, y)
        skeleton.baseScale = 0.7
        skeleton.addAura(0x00ff66, 1)
        skeleton.baseSpeed = this.baseSpeed
        skeleton.baseAttackDamage += this.abilityPower * 0.07
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

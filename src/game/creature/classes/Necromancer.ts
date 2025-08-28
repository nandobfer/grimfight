import { MagicCircleFx } from "../../fx/MagicCircleFx"
import { Deathbolt } from "../../objects/Deathbolt"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { MonsterRegistry } from "../monsters/MonsterRegistry"

export class Necromancer extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 15
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 150
    baseMaxHealth = 300
    baseArmor: number = 5
    baseAbilityPower: number = 50

    abilityName = "Arise"

    constructor(scene: Game, id: string) {
        super(scene, "zairon", id)
    }

    override getAbilityDescription(): string {
        const skeleton = MonsterRegistry.getBaseStats("skeleton")
        return `Sumona um esqueletinho para lutar ao seu lado:
Esqueleto:
vida máxima: [success.main:${Math.round(skeleton.baseMaxHealth + this.abilityPower)}] (${skeleton.baseMaxHealth} + [info.main:100% AP]).
dano de ataque: [error.main:${Math.round(skeleton.baseAttackDamage + this.abilityPower * 0.15)}] (${skeleton.baseAttackDamage} + [info.main:15% AP]).`
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
        skeleton.boardX = this.boardX
        skeleton.boardY = this.boardY
        skeleton.baseScale = 0.7
        skeleton.addAura(0x00ff66, 1)
        skeleton.baseSpeed = this.baseSpeed * 2
        skeleton.baseAttackDamage += this.abilityPower * 0.15
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

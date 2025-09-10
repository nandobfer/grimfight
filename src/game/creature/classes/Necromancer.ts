import { DarkSlashFx } from "../../fx/DarkSlashFx"
import { MagicCircleFx } from "../../fx/MagicCircleFx"
import { Game } from "../../scenes/Game"
import { DeathEaterTrait } from "../../systems/Traits/DeathEaterTrait"
import { Character } from "../character/Character"
import { MonsterRegistry } from "../monsters/MonsterRegistry"

export class Necromancer extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 15
    baseAttackRange = 3
    baseManaPerSecond = 10
    baseMaxMana = 150
    baseMaxHealth = 325
    baseArmor: number = 5

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
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 1, 6)
    }

    override landAttack() {
        if (!this.target) return

        const slash = new DarkSlashFx(this.target)
        this.onAttackLand("dark", this.target)
    }

    override castAbility(multiplier = 1): void {
        this.casting = true

        const skeleton = MonsterRegistry.create("skeleton", this.scene)
        skeleton.master = this
        this.team.minions.add(skeleton)
        const { x, y } = this.randomPointAround(true)
        const fx = new MagicCircleFx(this.scene, x, y)
        skeleton.teleportTo(x, y)
        skeleton.boardX = this.boardX
        skeleton.boardY = this.boardY
        skeleton.baseScale = this.mapXtoY(this.abilityPower * multiplier)
        skeleton.setTint(0x6645aa)
        skeleton.baseSpeed = this.baseSpeed * 2
        skeleton.baseAttackDamage += this.abilityPower * 0.15 * multiplier
        skeleton.baseMaxHealth += this.abilityPower * multiplier
        skeleton.reset()
        skeleton.target = this.target

        const deathEater = this.team.activeTraits.find((trait) => trait.name === "Deatheater") as DeathEaterTrait | undefined
        if (deathEater) {
            deathEater.applyModifier(skeleton)
        }

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()

        this.mana = this.maxMana * 0.65
    }

    createLinearMapping(x1: number, y1: number, x2: number, y2: number) {
        const slope = (y2 - y1) / (x2 - x1)
        const intercept = y1 - slope * x1

        return (x: number) => intercept + slope * x
    }

    mapXtoY = this.createLinearMapping(50, 0.7, 500, 1.4)
}

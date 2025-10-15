import { DarkSlashFx } from "../../fx/DarkSlashFx"
import { MagicCircleFx } from "../../fx/MagicCircleFx"
import { Game } from "../../scenes/Game"
import { Summon } from "../../systems/Summon"
import { DeathEaterTrait } from "../../systems/Traits/DeathEaterTrait"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"
import { MonsterRegistry } from "../monsters/MonsterRegistry"
import { Skeleton } from "../monsters/Skeleton"

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
        return `Summons a little skeleton to fight by your side: 
Skeleton: Max health: [success.main:${Math.round(skeleton.baseMaxHealth + this.abilityPower)}] (${
            skeleton.baseMaxHealth
        } + [info.main:100% AP]). Attack damage: [error.main:${Math.round(skeleton.baseAttackDamage + this.abilityPower * 0.15)}] (${
            skeleton.baseAttackDamage
        } + [info.main:15% AP]).`
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

        const skeleton = Summon.summon(RNG.weightedPick(Skeleton.weightedList), this, {
            abilityPower: this.abilityPower * 0.15 * multiplier,
            attackPower: this.abilityPower * 0.15 * multiplier,
            maxHealth: this.abilityPower * multiplier,
            scale: this.mapXtoY(Math.min(this.abilityPower, 6000) * multiplier),
            speed: this.baseSpeed * 2,
        })

        skeleton.setTint(0x6645aa)

        const deathEater = this.team.activeTraits.find((trait) => trait.name === "Deatheater") as DeathEaterTrait | undefined
        if (deathEater) {
            console.log("aplicando deatheater no esqueleto")
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

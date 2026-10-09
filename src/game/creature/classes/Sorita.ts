import { Game } from "../../scenes/Game"
import { Item } from "../../systems/Items/Item"
import { ItemRegistry } from "../../systems/Items/ItemRegistry"
import { SoritaDiceFx } from "../../fx/SoritaDiceFx"
import { Creature } from "../Creature"
import { Character } from "../character/Character"
import {
    isSoritaDropTarget,
    resolveSoritaDrop,
    soritaRollDamage,
    soritaRollsCrit,
    soritaStrikeDamageType,
    SORITA_BASE_DAMAGE_AD_RATIO,
    SORITA_DIE_FACES,
    SORITA_ROLL_DAMAGE_AD_RATIO,
    type SoritaDrop,
} from "./SoritaDice"

export class Sorita extends Character {
    baseAttackSpeed = 0.8
    baseAttackDamage = 20
    baseAttackRange = 1
    baseMaxHealth = 260
    baseMaxMana = 60
    baseManaPerSecond = 10
    baseAbilityPower = 50
    baseCritChance = 20

    abilityName = "Loaded Dice"

    private enemyDeathHandler?: (creature: Creature) => void

    constructor(scene: Game, id: string) {
        super(scene, "sorita", id)
        this.watchEnemyDeaths()
        this.once("destroy", () => this.clearEnemyDeathWatch())
    }

    override getAbilityDescription(): string {
        const minDamage = Math.round(soritaRollDamage(this.attackDamage, 1))
        const maxDamage = Math.round(soritaRollDamage(this.attackDamage, SORITA_DIE_FACES))
        const baseRatio = Math.round(SORITA_BASE_DAMAGE_AD_RATIO * 100)
        const perPipRatio = Math.round(SORITA_ROLL_DAMAGE_AD_RATIO * 100)

        return `Tosses a loaded die at the current target and strikes the moment it lands, dealing physical damage set by the face rolled: [error.main:${minDamage}] at the lowest face up to [error.main:${maxDamage}] at the highest, built from a [error.main:${baseRatio}% AD] base plus [error.main:${perPipRatio}% AD] per pip. A [primary.main:6] guarantees a [primary.main:critical hit] that ignores armor for true damage.

Passive: whenever an enemy dies, she rolls a hundred-sided die and keeps the best of [primary.main:${this.destinyRolls}]. A [primary.main:100] drops a random artifact; [primary.main:70], [primary.main:80] or [primary.main:90] drop a completed item; [primary.main:multiples of ten up to 60] drop a component.`
    }

    override castAbility(): boolean | void {
        if (!this.active || this.casting) return false

        const target = this.target?.active && this.target.canBeTargeted ? this.target : this.getClosestEnemy()
        if (!target) {
            this.target = undefined
            return false
        }

        this.casting = true
        this.target = target
        this.updateFacingDirection()
        this.playCastingAnimation()

        const roll = this.rollDestiny(SORITA_DIE_FACES)
        const { x, y } = this.randomPointAround()
        new SoritaDiceFx(this, roll, x, y)

        const { value, crit } = this.calculateDamage(soritaRollDamage(this.attackDamage, roll), soritaRollsCrit(roll))
        if (target.active) {
            target.takeDamage(value, this, soritaStrikeDamageType(roll), crit, true, this.abilityName)
        }

        this.casting = false
    }

    private watchEnemyDeaths(): void {
        const enemyTeam = this.scene.enemyTeam
        this.enemyDeathHandler = (creature: Creature) => this.onEnemyDeath(creature)

        enemyTeam.on("died", this.enemyDeathHandler)
    }

    private clearEnemyDeathWatch(): void {
        if (!this.enemyDeathHandler) return

        this.scene.enemyTeam.off("died", this.enemyDeathHandler)
        this.enemyDeathHandler = undefined
    }

    private onEnemyDeath(creature: Creature): void {
        if (!this.active || !isSoritaDropTarget(creature)) return

        const drop = resolveSoritaDrop(this.rollDestiny(100))
        if (!drop) return

        this.dropItem(drop)
    }

    private dropItem(drop: SoritaDrop): void {
        const item = this.createDropItem(drop)
        this.scene.availableItems.add(item)
        item.dropOnBoard()
        this.scene.saveProgress()
    }

    private createDropItem(drop: SoritaDrop): Item {
        switch (drop) {
            case "artifact":
                return ItemRegistry.randomArtifact(this.scene)
            case "completed":
                return ItemRegistry.randomCompleted(this.scene)
            case "component":
                return ItemRegistry.randomComponent(this.scene)
        }
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 14, repeat: 0 }, true)
    }
}

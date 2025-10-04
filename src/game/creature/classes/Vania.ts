import { Arrow } from "../../objects/Projectile/Arrow"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Vania extends Character {
    baseAttackSpeed = 1.35
    baseAttackDamage = 15
    baseAttackRange = 4
    baseMaxHealth = 200

    baseMaxMana: number = 0
    manaLocked: boolean = true
    attacksCount = 0

    abilityName: string = "Silver Bolt"

    constructor(scene: Game, id: string) {
        super(scene, "vania", id)
    }

    override getAbilityDescription(): string {
        return `Every [primary.main:3rd attack] shoots a silver arrow at the enemy, dealing [secondary.main:${Math.round(
            this.attackDamage + this.abilityPower * 0.7
        )}][error.main: (100% AD)][info.main: (70% AP)] true damage.`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 52, 8)
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    // levelUp(): void {
    //     super.levelUp()

    //     this.baseAttackDamage += 10
    // }

    override landAttack() {
        if (!this.target || !this?.active) return

        this.attacksCount += 1

        const arrow = new Arrow(this.scene, this.x, this.y, this)

        if (this.attacksCount === 3) {
            this.attacksCount = 0

            this.makeSilverBolt(arrow)
        }

        arrow.fire(this.target)
    }

    makeSilverBolt(arrow: Arrow) {
        arrow.setPipeline("Light2D")
        arrow.light = this.scene.lights.addLight(this.x, this.y, 45, 0xffffff, 10)
        // arrow.setScale(0.15, 0.15)
        arrow.onHit = (target) => {
            const { value, crit } = this.calculateDamage(this.attackDamage + this.abilityPower * 0.7)
            target.takeDamage(value, this, "true", crit, true, this.abilityName)
            this.onHit()
            arrow.destroy()
        }

        const handleUpdate = () => {
            if (arrow.active && arrow.light) {
                arrow.light.setPosition(arrow.x, arrow.y)
            }
        }
        this.scene.events.on("update", handleUpdate)
        arrow.once("destroy", () => {
            this.scene.events.off("update", handleUpdate)
            if (arrow?.light) {
                arrow.light = undefined
            }
        })
    }

    override refreshStats(): void {
        super.refreshStats()
        this.attacksCount = 0
    }
}

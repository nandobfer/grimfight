import { burstBlood } from "../../fx/Blood"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

export class Dracula extends Character {
    baseAttackSpeed = 1
    baseAttackDamage = 25
    baseMaxMana: number = 80
    baseMaxHealth: number = 385
    baseLifesteal: number = 15
    baseSpeed: number = 130
    baseCritChance: number = 20

    abilityName: string = "Caça Sangrenta"

    targetObserver = new Map<Creature, Function>()

    constructor(scene: Game, id: string) {
        super(scene, "dracula", id)
        this.once("destroy", () => this.clearTargetsObservers())
    }

    override getAbilityDescription(): string {
        return `Passive: Steals [primary.main:15%] of all damage dealt.
Passive: Heals for [success.main:${Math.round(this.maxHealth * 0.2)} (20% HP)] and gains [error.main:${Math.round(
            this.attackDamage * 0.2
        )} (20% AD)] until the end of combat when its target dies.

Active: Targets the enemy with the lowest health percentage and dashes to them, dealing [info.main:${Math.round(
            this.abilityPower
        )} (100% AP)] extra damage on your next attack.`
    }

    override getAttackingAnimation(): string {
        return `attacking1`
    }

    override castAbility(): void {
        this.casting = true

        this.target = this.scene.enemyTeam.getLowestHealth() || this.target
        const original = this.onAttackLand.bind(this)

        this.onAttackLand = () => {
            this.onAttackLand = original

            if (!this.target) return 0
            return super.onAttackLand("dark", this.target, this.attackDamage + this.abilityPower)
        }

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()

        this.onAttackLand = super.onAttackLand.bind(this)
        this.clearTargetsObservers()
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.target) {
            if (!this.targetObserver.has(this.target)) {
                this.observeTarget(this.target)
            }
        } else {
            this.clearTargetsObservers()
        }
    }

    clearTargetsObservers() {
        for (const [oldTarget, listener] of this.targetObserver) {
            oldTarget.off("died", listener, this)
            this.targetObserver.delete(oldTarget)
        }
    }

    observeTarget(creature: Creature) {
        this.clearTargetsObservers()

        const onTargetDie = () => {
            this.heal(this.maxHealth * 0.2, { healer: this, source: this.abilityName })
            // todo: vampire fx
            this.attackDamage += this.baseAttackDamage * 0.2
            creature.off("died", onTargetDie, this)
            this.targetObserver.delete(creature)
        }

        creature.on("died", onTargetDie, this)

        this.targetObserver.set(creature, onTargetDie)
    }
}

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
        this.setTint(0xff0000)
        this.once("destroy", () => this.clearTargetsObservers())
    }

    override getAbilityDescription(): string {
        return `Passivo: Rouba [primary.main:15%] de todo dano causado.
Passivo: Se cura em [success.main:${Math.round(this.maxHealth * 0.2)} (20% HP)] e recebe [error.main:${Math.round(
            this.attackDamage * 0.2
        )} (20% AD)] até o fim do combate, quando seu alvo morre.

Ativo: Alveja o inimigo com menor porcentagem de vida e avança até ele, causando [info.main:${Math.round(
            this.abilityPower
        )} (100% AP)] de dano extra no seu próximo ataque.`
    }

    override getAttackingAnimation(): string {
        return `attacking`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 4
        const attacking = this.extractAnimationsFromSpritesheet("attacking", 1, 5, 6, "arthas_attacking")

        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if (attacking.find((anim) => anim.key === animation.key)) {
                this.setOrigin(0.5, 0.6)
            } else {
                this.setOrigin(0.5, 0.75)
            }
        }

        this.on("animationstart", onUpdate)
        this.once("destroy", () => this.off("animationstart", onUpdate))
    }

    override castAbility(): void {
        this.casting = true

        this.target = this.scene.enemyTeam.getLowestHealth() || this.target
        const original = this.onAttackLand.bind(this)

        this.onAttackLand = () => {
            this.onAttackLand = original

            if (!this.target) return 0
            this.onAttackLand = super.onAttackLand.bind(this)
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
            this.heal(this.maxHealth * 0.2)
            this.attackDamage += this.baseAttackDamage * 0.2
            creature.off("died", onTargetDie, this)
            this.targetObserver.delete(creature)
        }

        creature.on("died", onTargetDie, this)

        this.targetObserver.set(creature, onTargetDie)
    }
}

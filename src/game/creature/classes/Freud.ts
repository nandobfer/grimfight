import { SoulKnife } from "../../objects/Projectile/SoulKnife"
import { Game, GameState } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

export class Freud extends Character {
    baseAttackSpeed = 1
    baseAttackDamage = 30
    baseAttackRange = 4
    baseMaxHealth = 250
    baseMaxMana: number = 0
    manaLocked: boolean = true

    abilityName: string = "Lâminas Psíquicas"

    private enemyMoveHandlers = new Map<Creature, () => void>()

    constructor(scene: Game, id: string) {
        super(scene, "freud", id)

        this.scene.events.on("gamestate", this.handleGameState, this)
        this.once("destroy", () => {
            this.scene.events.off("gamestate", this.handleGameState, this)
            this.clearMindAgileObservers()
        })
    }

    override getAbilityDescription(): string {
        return `Passiva - [primary.main:Mente Ágil]: quando um inimigo entra no alcance corpo a corpo de Freud, ele muda para esse alvo e tenta atacá-lo imediatamente.

Passiva - [primary.main:Mente Afiada]: acertos críticos causam [info.main:${Math.round(
            this.abilityPower * 0.75
        )} (75% AP)] de dano mágico adicional com crítico garantido. Freud recebe um escudo equivalente ao dano adicional causado.`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 3
        const attacking = this.extractAnimationsFromSpritesheet("attacking2", 1, 5, 13, "freud_attacking")
        const specialAttacking = this.extractAnimationsFromSpritesheet("attacking1", 52, 6, 13, "freud_attacking")

        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if ([...attacking, ...specialAttacking].find((anim) => anim.key === animation.key)) {
                this.setOrigin(0.5, 0.6)
                this.body.setOffset(64, 64)
            } else {
                this.setOrigin(0.5, 0.75)
                this.body.setOffset(0, 0)
            }
        }

        this.on("animationstart", onUpdate)
        this.once("destroy", () => this.off("animationstart", onUpdate))
    }

    override landAttack() {
        if (!this.target || !this.active) return

        const soulKnife = new SoulKnife(this.scene, this.x, this.y, this)
        soulKnife.onHit = (target) => {
            const { value, crit } = this.calculateDamage(this.attackDamage)
            target.takeDamage(value, this, "normal", crit, true)

            if (crit && target.active) {
                const additionalDamage = this.calculateDamage(this.abilityPower * 0.75, true)
                const damageDealt = target.takeDamage(additionalDamage.value, this, "dark", true, true, "Mente Afiada")
                if (damageDealt > 0) {
                    this.gainShield(damageDealt, { healer: this, source: "Mente Afiada" })
                }
            }

            this.onHit(target)
            soulKnife.destroy()
        }

        soulKnife.fire(this.target)
    }

    private handleGameState(state: GameState) {
        if (state === "fighting") {
            this.observeEnemiesForMindAgile()
            return
        }

        this.clearMindAgileObservers()
    }

    private observeEnemiesForMindAgile() {
        this.clearMindAgileObservers()

        const enemies = this.getEnemyTeam().getChildren(true, true)
        for (const enemy of enemies) {
            const handler = () => this.tryMindAgileRetarget(enemy)
            enemy.on("move", handler)
            this.enemyMoveHandlers.set(enemy, handler)
        }
    }

    private clearMindAgileObservers() {
        for (const [enemy, handler] of this.enemyMoveHandlers) {
            enemy.off("move", handler)
        }

        this.enemyMoveHandlers.clear()
    }

    private tryMindAgileRetarget(enemy: Creature) {
        if (this.scene.state !== "fighting" || !this.active || !enemy.active || !enemy.canBeTargeted) return
        if (this.target === enemy || this.casting || this.frozen) return

        if (!this.getAdjacentEnemies(true).includes(enemy)) return

        this.target = enemy
        this.stopMoving()
        this.updateFacingDirection()
        this.startAttack()
    }

    override refreshStats(): void {
        super.refreshStats()
        this.clearMindAgileObservers()
    }
}

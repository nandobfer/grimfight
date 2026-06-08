import { SoulKnife } from "../../objects/Projectile/SoulKnife"
import { Game, GameState } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

export class Freud extends Character {
    baseAttackSpeed = 1.35
    baseAttackDamage = 15
    baseAttackRange = 4
    baseMaxHealth = 200
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
            this.abilityPower
        )} (100% AP)] de dano mágico adicional com crítico garantido. Freud recebe um escudo equivalente ao dano adicional causado.`
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 6
        this.extractAnimationsFromSpritesheet("attacking", 52, 8)
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override landAttack() {
        if (!this.target || !this.active) return

        const soulKnife = new SoulKnife(this.scene, this.x, this.y, this)
        soulKnife.onHit = (target) => {
            const { value, crit } = this.calculateDamage(this.attackDamage)
            target.takeDamage(value, this, "normal", crit, true)

            if (crit && target.active) {
                const additionalDamage = this.calculateDamage(this.abilityPower, true)
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

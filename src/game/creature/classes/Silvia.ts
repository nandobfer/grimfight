import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import type { Direction } from "../Creature"
import {
    calculateSilviaChainDamage,
    calculateSilviaPassiveBonuses,
    getSilviaChainPoint,
    getSilviaPullDestination,
    SILVIA_CHAIN_HIT_DISTANCE,
    SILVIA_CHAIN_MAX_DURATION_MS,
    SILVIA_CHAIN_TRAVEL_MS,
    SILVIA_PULL_DURATION_MS,
} from "./SilviaChains"
import type { SilviaPoint } from "./SilviaChains"

type ZoneWithBody = Phaser.GameObjects.Zone & { body?: Phaser.Physics.Arcade.Body }
type RoundFxObject = Phaser.GameObjects.GameObject & { scene?: Phaser.Scene }

interface ChainState {
    hitbox: ZoneWithBody
    start: SilviaPoint
    progress: number
    lateralOffset: number
    overlap?: Phaser.Physics.Arcade.Collider
}

const silviaChainPurple = 0x8b5cf6
const silviaChainDark = 0x2e1247
const silviaChainBright = 0xe9d5ff
const silviaChainHitboxSize = 18

export class Silvia extends Character {
    baseAttackSpeed = 0.72
    baseAttackDamage = 20
    baseMaxMana = 90
    baseMaxHealth = 425
    baseArmor = 10

    abilityName = "Correntes da Matriarca"

    private readonly activeFxCleanups = new Set<() => void>()
    private readonly recentChainTargets = new Set<Creature>()
    private passiveMaxHealthBonus = 0
    private passiveAbilityPowerBonus = 0

    constructor(scene: Game, id: string) {
        super(scene, "silvia", id)
    }

    override getAbilityDescription(): string {
        const passive = calculateSilviaPassiveBonuses(this.getExternalAbilityPower(), this.getExternalMaxHealth())
        const damage = calculateSilviaChainDamage(this.abilityPower)

        return `Passiva: Silvia ganha [success.main:${Math.round(
            passive.maxHealthBonus
        )} de vida máxima] [info.main:(130% AP)] e [info.main:${Math.round(
            passive.abilityPowerBonus
        )} de AP] [success.main:(5% vida máxima)].

Ao conjurar [primary.main:${this.abilityName}], Silvia protege o aliado mais ferido, lançando duas correntes arcanas contra o inimigo que o ameaça. As correntes causam [info.main:${Math.round(
            damage
        )} (135% AP)] de dano sombrio, puxam o alvo para frente de Silvia e o forçam a atacá-la. Se nenhum aliado estiver sob ameaça, Silvia prende o inimigo mais distante.`
    }

    override castAbility(multiplier = 1): boolean | void {
        const excludedTargets = multiplier !== 1 ? this.recentChainTargets : undefined
        if (multiplier === 1) this.recentChainTargets.clear()

        const target = this.getSilviaCastTarget(excludedTargets) ?? this.getSilviaCastTarget()
        if (!target) {
            this.target = undefined
            return false
        }

        this.recentChainTargets.add(target)
        this.casting = true
        this.target = target
        this.updateFacingDirection()
        this.startChanneling()
        this.playCastingAnimation()
        this.launchChains(target, multiplier)
    }

    override refreshStats(): void {
        super.refreshStats()
        this.cleanupActiveFx()
        this.recentChainTargets.clear()
        this.passiveMaxHealthBonus = 0
        this.passiveAbilityPowerBonus = 0
        this.syncPassiveBonuses()
        this.gainMana(this.maxMana * 0.3)
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
        if (this.active) this.syncPassiveBonuses()
    }

    override destroy(fromScene?: boolean): void {
        this.cleanupActiveFx()
        super.destroy(fromScene)
    }

    private syncPassiveBonuses(): void {
        const bonuses = calculateSilviaPassiveBonuses(this.getExternalAbilityPower(), this.getExternalMaxHealth())
        const maxHealthDelta = bonuses.maxHealthBonus - this.passiveMaxHealthBonus
        const abilityPowerDelta = bonuses.abilityPowerBonus - this.passiveAbilityPowerBonus

        if (Math.abs(maxHealthDelta) < 0.001 && Math.abs(abilityPowerDelta) < 0.001) return

        this.maxHealth += maxHealthDelta
        this.health = Phaser.Math.Clamp(this.health + maxHealthDelta, 0, this.maxHealth)
        this.abilityPower += abilityPowerDelta
        this.passiveMaxHealthBonus = bonuses.maxHealthBonus
        this.passiveAbilityPowerBonus = bonuses.abilityPowerBonus
        this.updateHealthUi()
    }

    private getExternalAbilityPower(): number {
        return this.abilityPower - this.passiveAbilityPowerBonus
    }

    private getExternalMaxHealth(): number {
        return this.maxHealth - this.passiveMaxHealthBonus
    }

    private getSilviaCastTarget(excludedTargets?: Set<Creature>): Creature | undefined {
        const threatenedAlly = this.getLowestHealthThreatenedAlly(excludedTargets)
        const protectorTarget = threatenedAlly ? this.getClosestEnemyTargeting(threatenedAlly, excludedTargets) : undefined
        if (protectorTarget) return protectorTarget

        return this.getFarthestEnemy(excludedTargets)
    }

    private getLowestHealthThreatenedAlly(excludedTargets?: Set<Creature>): Creature | undefined {
        const allies = this.team
            .getChildren(true, true)
            .filter((ally) => ally !== this && ally.active && ally.health > 0) as Creature[]

        let chosen: Creature | undefined
        let chosenHealthFraction = Number.POSITIVE_INFINITY

        for (const ally of allies) {
            if (!this.getClosestEnemyTargeting(ally, excludedTargets)) continue

            const healthFraction = ally.maxHealth > 0 ? ally.health / ally.maxHealth : 1
            if (!chosen || healthFraction < chosenHealthFraction) {
                chosen = ally
                chosenHealthFraction = healthFraction
            }
        }

        return chosen
    }

    private getClosestEnemyTargeting(ally: Creature, excludedTargets?: Set<Creature>): Creature | undefined {
        const enemies = this.getEnemyTeam()
            .getChildren(true, true)
            .filter((enemy) => !excludedTargets?.has(enemy) && enemy.active && enemy.canBeTargeted && enemy.target === ally) as Creature[]

        let chosen: Creature | undefined
        let chosenDistance = Number.POSITIVE_INFINITY

        for (const enemy of enemies) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
            if (!chosen || distance < chosenDistance) {
                chosen = enemy
                chosenDistance = distance
            }
        }

        return chosen
    }

    private getFarthestEnemy(excludedTargets?: Set<Creature>): Creature | undefined {
        const enemies = this.getEnemyTeam()
            .getChildren(true, true)
            .filter((enemy) => !excludedTargets?.has(enemy) && enemy.active && enemy.canBeTargeted) as Creature[]

        let chosen: Creature | undefined
        let chosenDistance = Number.NEGATIVE_INFINITY

        for (const enemy of enemies) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
            if (!chosen || distance > chosenDistance) {
                chosen = enemy
                chosenDistance = distance
            }
        }

        return chosen
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 12, repeat: -1 }, true)
    }

    private launchChains(target: Creature, multiplier: number): void {
        const graphic = this.scene.add.graphics().setDepth(this.depth + 13).setBlendMode(Phaser.BlendModes.ADD)
        const chains: ChainState[] = [
            this.createChainState(-1, target),
            this.createChainState(1, target),
        ]
        const startedAt = this.scene.time.now
        let cleaned = false
        let lifespanTimer: Phaser.Time.TimerEvent | undefined

        this.trackRoundFx(graphic)

        const hitTarget = () => {
            if (cleaned) return
            if (!target.active || !this.active || this.scene.state !== "fighting") {
                cleanup()
                return
            }

            const { value, crit } = this.calculateDamage(calculateSilviaChainDamage(this.abilityPower, multiplier))
            target.takeDamage(value, this, "dark", crit, true, this.abilityName)
            this.onHit(target)
            if (target.active && this.active && this.scene.state === "fighting") {
                this.pullTargetToFront(target)
            }
            cleanup()
        }
        const updateChains = (time: number, delta: number) => {
            if (!graphic.active || !this.active || !target.active || this.scene.state !== "fighting") {
                cleanup()
                return
            }

            const targetAnchor = this.getTargetAnchor(target)
            for (const chain of chains) {
                chain.progress = Math.min(1, chain.progress + delta / SILVIA_CHAIN_TRAVEL_MS)
                const head = getSilviaChainPoint(chain.start, targetAnchor, chain.progress, chain.lateralOffset)
                chain.hitbox.setPosition(head.x, head.y)
                chain.hitbox.body?.reset(head.x, head.y)
                if (Phaser.Math.Distance.Between(head.x, head.y, targetAnchor.x, targetAnchor.y) <= SILVIA_CHAIN_HIT_DISTANCE) {
                    hitTarget()
                    return
                }
            }

            this.drawChains(graphic, chains, targetAnchor, time - startedAt)
        }
        const cleanup = (destroyGraphic = true) => {
            if (cleaned) return
            cleaned = true
            this.scene.events.off("update", updateChains)
            this.scene.events.off("gamestate", stopChains)
            target.off("destroy", stopChains)
            target.off("died", stopChains)
            lifespanTimer?.remove(false)
            lifespanTimer = undefined

            for (const chain of chains) {
                chain.overlap?.destroy()
                if (chain.hitbox.active) this.destroyRoundFx(chain.hitbox)
            }

            if (destroyGraphic && graphic.active) this.destroyRoundFx(graphic)
            this.activeFxCleanups.delete(stopChains)
            this.stopChanneling()
            this.casting = false
        }
        const stopChains = () => cleanup()

        for (const chain of chains) {
            chain.overlap = this.scene.physics.add.overlap(chain.hitbox, target, hitTarget)
            chain.hitbox.once("destroy", () => cleanup())
        }
        graphic.once("destroy", () => cleanup(false))
        this.scene.events.on("update", updateChains)
        this.scene.events.once("gamestate", stopChains)
        target.once("destroy", stopChains)
        target.once("died", stopChains)
        lifespanTimer = this.scene.time.delayedCall(SILVIA_CHAIN_MAX_DURATION_MS, cleanup)
        this.activeFxCleanups.add(stopChains)
    }

    private createChainState(side: -1 | 1, target: Creature): ChainState {
        const start = this.getHandAnchor(side)
        const hitbox = this.scene.add.zone(start.x, start.y, silviaChainHitboxSize, silviaChainHitboxSize) as ZoneWithBody
        const targetAnchor = this.getTargetAnchor(target)
        const distance = Phaser.Math.Distance.Between(start.x, start.y, targetAnchor.x, targetAnchor.y)

        this.trackRoundFx(hitbox)
        this.scene.physics.add.existing(hitbox)
        hitbox.body?.setCircle(silviaChainHitboxSize / 2)
        if (hitbox.body) hitbox.body.allowGravity = false

        return {
            hitbox,
            start,
            progress: 0,
            lateralOffset: side * Math.max(28, Math.min(68, distance * 0.34)),
        }
    }

    private getHandAnchor(side: -1 | 1): SilviaPoint {
        const offsets: Record<Direction, SilviaPoint> = {
            down: { x: side * 15, y: -18 },
            up: { x: side * -15, y: -22 },
            left: { x: -17, y: side === -1 ? -24 : -14 },
            right: { x: 17, y: side === -1 ? -14 : -24 },
        }
        const offset = offsets[this.facing]

        return { x: this.x + offset.x, y: this.y + offset.y }
    }

    private getTargetAnchor(target: Creature): SilviaPoint {
        return { x: target.x, y: target.y - 18 }
    }

    private drawChains(graphic: Phaser.GameObjects.Graphics, chains: ChainState[], targetAnchor: SilviaPoint, elapsed: number): void {
        graphic.clear()

        for (const chain of chains) {
            this.drawSingleChain(graphic, chain, targetAnchor, elapsed)
        }
    }

    private drawSingleChain(graphic: Phaser.GameObjects.Graphics, chain: ChainState, targetAnchor: SilviaPoint, elapsed: number): void {
        const points: SilviaPoint[] = []
        const samples = 14
        for (let index = 0; index <= samples; index++) {
            const progress = chain.progress * (index / samples)
            points.push(getSilviaChainPoint(chain.start, targetAnchor, progress, chain.lateralOffset))
        }

        graphic.lineStyle(8, silviaChainDark, 0.2)
        this.strokeChainPath(graphic, points)
        graphic.lineStyle(3, silviaChainPurple, 0.78)
        this.strokeChainPath(graphic, points)
        graphic.lineStyle(1, silviaChainBright, 0.82)
        this.strokeChainPath(graphic, points)

        for (let index = 1; index < points.length; index += 2) {
            const point = points[index]
            const pulse = (Math.sin(elapsed * 0.018 + index) + 1) * 0.5
            graphic.fillStyle(silviaChainPurple, 0.42 + pulse * 0.25)
            graphic.fillCircle(point.x, point.y, 2.6 + pulse * 1.2)
            graphic.lineStyle(1.5, silviaChainBright, 0.52)
            graphic.strokeCircle(point.x, point.y, 4.3)
        }
    }

    private strokeChainPath(graphic: Phaser.GameObjects.Graphics, points: SilviaPoint[]): void {
        if (points.length === 0) return

        graphic.beginPath()
        graphic.moveTo(points[0].x, points[0].y)
        for (const point of points.slice(1)) {
            graphic.lineTo(point.x, point.y)
        }
        graphic.strokePath()
    }

    private pullTargetToFront(target: Creature): void {
        const destination = getSilviaPullDestination({ x: this.x, y: this.y }, { x: target.x, y: target.y }, this.facing)
        let cleaned = false
        let tween: Phaser.Tweens.Tween | undefined
        const previousMoveLocked = target.moveLocked

        target.stopMoving()
        target.moveLocked = true

        const cleanup = (complete = false) => {
            if (cleaned) return
            cleaned = true
            this.scene.events.off("gamestate", stopPull)
            target.off("destroy", stopPull)
            target.off("died", stopPull)
            this.activeFxCleanups.delete(stopPull)
            if (tween) {
                tween.stop()
                this.scene.tweens.remove(tween)
                tween = undefined
            }
            if (target.active) {
                target.moveLocked = previousMoveLocked
                target.body?.reset(target.x, target.y)
                target.emit("move", target, target.x, target.y)
                if (complete) this.taunt(target)
            }
        }
        const stopPull = () => cleanup(false)

        this.scene.events.once("gamestate", stopPull)
        target.once("destroy", stopPull)
        target.once("died", stopPull)
        this.activeFxCleanups.add(stopPull)

        tween = this.scene.tweens.add({
            targets: target,
            x: destination.x,
            y: destination.y,
            duration: SILVIA_PULL_DURATION_MS,
            ease: "Cubic.easeOut",
            onUpdate: () => target.body?.reset(target.x, target.y),
            onComplete: () => cleanup(true),
            onStop: () => cleanup(false),
        })
    }

    private trackRoundFx<T extends RoundFxObject>(object: T): T {
        this.scene.perRoundFx.add(object)
        return object
    }

    private destroyRoundFx(object?: RoundFxObject): void {
        if (!object) return

        this.scene.perRoundFx.remove(object, false, false)
        if (object.scene) object.destroy(true)
    }

    private cleanupActiveFx(): void {
        for (const cleanup of [...this.activeFxCleanups]) {
            cleanup()
        }
        this.activeFxCleanups.clear()
        this.casting = false
        if (this.attackLocked || this.moveLocked || this.manaLocked) {
            this.stopChanneling()
        }
    }
}

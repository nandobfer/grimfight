import { Game } from "../../scenes/Game"
import { Projectile } from "../../objects/Projectile/Projectile"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    calculateRobiltonBlackHolePullStrength,
    calculateRobiltonBlackHoleRadius,
    calculateRobiltonCastDuration,
    calculateRobiltonExplosionDamage,
    calculateRobiltonExplosionRadius,
    calculateRobiltonGravityOrbDamage,
    calculateRobiltonStarRadius,
    ROBILTON_ATTACK_PROJECTILE_SPEED,
    ROBILTON_BLACK_HOLE_DURATION_MS,
    ROBILTON_NEUTRON_STAR_SPEED,
} from "./RobiltonNeutronStar"

interface GravityOrbState {
    stacks: number
    orbitSeed: number
    removeListeners: () => void
}

interface TrailPoint {
    x: number
    y: number
    age: number
}

type ZoneWithBody = Phaser.GameObjects.Zone & { body?: Phaser.Physics.Arcade.Body }
type RoundFxObject = Phaser.GameObjects.GameObject & { scene?: Phaser.Scene }

const gravityOrbColor = 0x8b5cf6
const gravityOrbCoreColor = 0xf5e8ff
const neutronDarkColor = 0x160326
const neutronPurpleColor = 0x7c3aed
const neutronBrightColor = 0xd8b4fe
const attackProjectileHitboxSize = 12
const neutronProjectileHitboxSize = 20

export class Robilton extends Character {
    baseAttackSpeed = 1
    baseSpeed = 105
    baseAttackDamage = 18
    baseAttackRange = 4
    baseMaxHealth = 220
    baseMaxMana = 150
    baseAbilityPower = 50

    abilityName = "Estrela de Nêutrons"

    private gravityOrbs = new Map<Creature, GravityOrbState>()
    private gravityOrbGraphic?: Phaser.GameObjects.Graphics
    private readonly activeFxCleanups = new Set<() => void>()
    private gravityOrbElapsed = 0

    constructor(scene: Game, id: string) {
        super(scene, "robilton", id)
        this.createGravityOrbFx()
    }

    override getAbilityDescription(): string {
        return `Robilton dispara flechas arcanas à distância. Cada ataque aplica um [primary.main:Orbe de Gravidade] ao alvo.

Ao conjurar [primary.main:${this.abilityName}], Robilton canaliza uma estrela roxa por um tempo reduzido pela velocidade de ataque, então a dispara contra o alvo. A estrela explode causando [info.main:${Math.round(
            calculateRobiltonExplosionDamage(this.abilityPower)
        )} (200% AP)] de dano sombrio em área, detona Orbes de Gravidade dos inimigos atingidos causando [info.main:${Math.round(
            calculateRobiltonGravityOrbDamage(this.abilityPower, 1)
        )} (12% AP)] de dano sombrio por stack, e cria um buraco negro por [primary.main:1 segundo] que puxa inimigos para o centro.`
    }

    override landAttack(): void {
        const target = this.target
        if (!target?.active || !this.active) return

        this.launchGravityArrow(target)
    }

    override castAbility(multiplier = 1): boolean | void {
        const target = this.getCastTarget()
        if (!target) {
            this.target = undefined
            return false
        }

        this.casting = true
        this.target = target
        this.updateFacingDirection()
        this.startChanneling()
        this.playCastingAnimation()
        this.channelNeutronStar(multiplier)
    }

    override refreshStats(): void {
        super.refreshStats()
        this.cleanupActiveFx()
        this.clearGravityOrbs()
        this.gainMana(this.maxMana * 0.3)
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        this.gravityOrbElapsed += delta
        if (this.scene.state === "idle" || !this.active) {
            this.clearGravityOrbs()
        }
        this.drawGravityOrbs(time)
    }

    private createGravityOrbFx(): void {
        this.gravityOrbGraphic = this.scene.add.graphics().setDepth(this.depth + 9).setBlendMode(Phaser.BlendModes.ADD)
    }

    private trackRoundFx<T extends RoundFxObject>(object: T): T {
        this.scene.perRoundFx.add(object)
        return object
    }

    private destroyRoundFx(object?: RoundFxObject): void {
        if (!object) return

        this.scene.perRoundFx.remove(object, false, false)
        if (object.scene) {
            object.destroy(true)
        }
    }

    private launchGravityArrow(target: Creature): void {
        const hitbox = this.scene.add.zone(this.x, this.y - 16, attackProjectileHitboxSize, attackProjectileHitboxSize) as ZoneWithBody
        const graphic = this.scene.add.graphics().setDepth(this.depth + 10).setBlendMode(Phaser.BlendModes.ADD)
        let cleaned = false
        let overlap: Phaser.Physics.Arcade.Collider | undefined
        let lifespanTimer: Phaser.Time.TimerEvent | undefined

        this.trackRoundFx(hitbox)
        this.trackRoundFx(graphic)
        this.scene.physics.add.existing(hitbox)

        const body = hitbox.body
        if (!body) {
            this.destroyRoundFx(hitbox)
            this.destroyRoundFx(graphic)
            return
        }

        body.allowGravity = false
        body.setCircle(attackProjectileHitboxSize / 2)

        const updateProjectile = (_time: number, delta: number) => {
            if (!hitbox.active || !graphic.active) {
                cleanup()
                return
            }

            this.drawGravityArrow(graphic, hitbox.x, hitbox.y, delta)
        }
        const cleanup = (destroyHitbox = true, destroyGraphic = true) => {
            if (cleaned) return
            cleaned = true
            this.scene.events.off("update", updateProjectile)
            this.scene.events.off("gamestate", cleanup)
            target.off("destroy", cleanup)
            overlap?.destroy()
            lifespanTimer?.remove(false)
            this.activeFxCleanups.delete(cleanup)

            if (destroyHitbox && hitbox.active) this.destroyRoundFx(hitbox)
            if (destroyGraphic && graphic.active) this.destroyRoundFx(graphic)
        }
        const hitTarget = () => {
            if (cleaned) return
            if (target.active && this.active) {
                const { value, crit } = this.calculateDamage(this.attackDamage)
                target.takeDamage(value, this, "normal", crit, true, "Attack")
                this.onHit(target)
                this.addGravityOrb(target)
            }
            cleanup()
        }

        hitbox.once("destroy", () => cleanup(false, true))
        graphic.once("destroy", () => cleanup(true, false))
        this.scene.events.on("update", updateProjectile)
        this.scene.events.once("gamestate", cleanup)
        target.once("destroy", cleanup)
        overlap = this.scene.physics.add.overlap(hitbox, target, hitTarget)
        lifespanTimer = this.scene.time.delayedCall(1500, () => cleanup())
        this.activeFxCleanups.add(cleanup)

        const angle = Phaser.Math.Angle.Between(hitbox.x, hitbox.y, target.x, target.y - 12)
        this.scene.physics.velocityFromRotation(angle, ROBILTON_ATTACK_PROJECTILE_SPEED, body.velocity)
    }

    private drawGravityArrow(graphic: Phaser.GameObjects.Graphics, x: number, y: number, delta: number): void {
        void delta
        graphic.clear()
        graphic.fillStyle(gravityOrbColor, 0.22)
        graphic.fillCircle(x, y, 8)
        graphic.fillStyle(neutronBrightColor, 0.85)
        graphic.fillCircle(x, y, 3)
        graphic.lineStyle(2, gravityOrbColor, 0.55)
        graphic.strokeCircle(x, y, 5)
    }

    private addGravityOrb(target: Creature): void {
        const existing = this.gravityOrbs.get(target)
        if (existing) {
            existing.stacks += 1
            return
        }

        const cleanup = () => this.gravityOrbs.delete(target)
        const state: GravityOrbState = {
            stacks: 1,
            orbitSeed: Phaser.Math.FloatBetween(0, Math.PI * 2),
            removeListeners: () => {
                target.off("died", cleanup)
                target.off("destroy", cleanup)
            },
        }

        target.once("died", cleanup)
        target.once("destroy", cleanup)
        this.gravityOrbs.set(target, state)
    }

    private clearGravityOrbs(): void {
        for (const state of this.gravityOrbs.values()) {
            state.removeListeners()
        }
        this.gravityOrbs.clear()
        this.gravityOrbGraphic?.clear()
    }

    private consumeGravityOrbs(target: Creature): number {
        const state = this.gravityOrbs.get(target)
        if (!state) return 0

        state.removeListeners()
        this.gravityOrbs.delete(target)
        return state.stacks
    }

    private drawGravityOrbs(time: number): void {
        const graphic = this.gravityOrbGraphic
        if (!graphic?.active) return

        graphic.clear()
        if (this.gravityOrbs.size === 0) return

        graphic.setDepth(this.depth + 9)
        const seconds = time / 1000

        for (const [target, state] of this.gravityOrbs) {
            if (!target.active) continue

            const orbitRadiusX = 18 + Math.min(18, state.stacks * 1.2)
            const orbitRadiusY = 8 + Math.min(10, state.stacks * 0.6)

            for (let index = 0; index < state.stacks; index++) {
                const angle = state.orbitSeed + seconds * 3.4 + (index / Math.max(1, state.stacks)) * Math.PI * 2
                const pulse = (Math.sin(seconds * 7 + index) + 1) * 0.5
                const x = target.x + Math.cos(angle) * orbitRadiusX
                const y = target.y - 24 + Math.sin(angle) * orbitRadiusY
                const radius = 2.4 + pulse * 1.1

                graphic.fillStyle(gravityOrbColor, 0.22)
                graphic.fillCircle(x, y, radius * 2.4)
                graphic.fillStyle(gravityOrbColor, 0.78)
                graphic.fillCircle(x, y, radius)
                graphic.fillStyle(gravityOrbCoreColor, 0.85)
                graphic.fillCircle(x - radius * 0.18, y - radius * 0.22, Math.max(0.8, radius * 0.36))
            }
        }
    }

    private getCastTarget(): Creature | undefined {
        if (this.target?.active && this.target.canBeTargeted) return this.target

        this.newTarget()
        return this.target?.active && this.target.canBeTargeted ? this.target : undefined
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        const durationSeconds = calculateRobiltonCastDuration(this.getAttackingSpeed()) / 1000
        this.play({ key, frameRate: 7 / Math.max(0.1, durationSeconds), repeat: -1 }, true)
    }

    private channelNeutronStar(multiplier: number): void {
        const graphic = this.scene.add.graphics().setDepth(this.depth + 12).setBlendMode(Phaser.BlendModes.ADD)
        const finalRadius = calculateRobiltonStarRadius(this.abilityPower)
        const duration = calculateRobiltonCastDuration(this.getAttackingSpeed())
        let cleaned = false
        let tween: Phaser.Tweens.Tween | undefined

        this.trackRoundFx(graphic)

        const cleanup = (release = false) => {
            if (cleaned) return
            cleaned = true
            this.scene.events.off("gamestate", stopChannel)
            this.activeFxCleanups.delete(stopChannel)

            if (tween) {
                tween.stop()
                this.scene.tweens.remove(tween)
                tween = undefined
            }

            if (graphic.active) this.destroyRoundFx(graphic)
            this.stopChanneling()
            this.casting = false
            if (this.active && release) this.releaseNeutronStar(multiplier, finalRadius)
        }
        const stopChannel = () => cleanup(false)

        graphic.once("destroy", stopChannel)
        this.scene.events.once("gamestate", stopChannel)
        this.activeFxCleanups.add(stopChannel)

        tween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration,
            ease: "Sine.easeInOut",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => {
                const progress = activeTween.getValue() as number
                this.drawChannelStar(graphic, progress, finalRadius)
            },
            onComplete: () => cleanup(true),
            onStop: () => cleanup(false),
        })
    }

    private drawChannelStar(graphic: Phaser.GameObjects.Graphics, progress: number, finalRadius: number): void {
        const eased = Phaser.Math.Easing.Cubic.Out(progress)
        const radius = finalRadius * eased
        const centerX = this.x
        const centerY = this.y - 24

        graphic.clear()
        graphic.fillStyle(neutronPurpleColor, 0.18 + progress * 0.16)
        graphic.fillCircle(centerX, centerY, radius * 2.6)
        graphic.fillStyle(neutronPurpleColor, 0.62)
        graphic.fillCircle(centerX, centerY, radius)
        graphic.fillStyle(gravityOrbCoreColor, 0.86)
        graphic.fillCircle(centerX - radius * 0.15, centerY - radius * 0.18, Math.max(2, radius * 0.32))
        graphic.lineStyle(2, neutronBrightColor, 0.2 + progress * 0.45)
        graphic.strokeCircle(centerX, centerY, radius * 1.45)

        for (let index = 0; index < 6; index++) {
            const angle = this.gravityOrbElapsed * 0.006 + index * 1.047
            const sparkX = centerX + Math.cos(angle) * radius * 1.65
            const sparkY = centerY + Math.sin(angle) * radius
            graphic.fillStyle(index % 2 === 0 ? neutronBrightColor : gravityOrbColor, 0.35 + progress * 0.35)
            graphic.fillCircle(sparkX, sparkY, 1.6 + progress * 1.5)
        }
    }

    private releaseNeutronStar(multiplier: number, starRadius: number): void {
        const target = this.getCastTarget()
        if (!target) return

        this.target = target
        this.updateFacingDirection()
        const startX = this.x
        const startY = this.y - 24
        const hitbox = this.scene.add.zone(startX, startY, neutronProjectileHitboxSize, neutronProjectileHitboxSize) as ZoneWithBody
        const graphic = this.scene.add.graphics().setDepth(this.depth + 14).setBlendMode(Phaser.BlendModes.ADD)
        const trail: TrailPoint[] = []
        let cleaned = false
        let overlap: Phaser.Physics.Arcade.Collider | undefined
        let wallCollider: Phaser.Physics.Arcade.Collider | undefined
        let lifespanTimer: Phaser.Time.TimerEvent | undefined

        this.trackRoundFx(hitbox)
        this.trackRoundFx(graphic)
        this.scene.physics.add.existing(hitbox)

        const body = hitbox.body
        if (!body) {
            this.destroyRoundFx(hitbox)
            this.destroyRoundFx(graphic)
            return
        }

        body.allowGravity = false
        body.setCircle(neutronProjectileHitboxSize / 2)

        const detonate = (detonationX = hitbox.x, detonationY = hitbox.y) => {
            if (cleaned) return
            cleanup()
            this.detonateNeutronStar(detonationX, detonationY, multiplier)
        }
        const detonateOnEnemy = (_hitbox: unknown, enemyObject: unknown) => {
            const enemy = enemyObject as Creature
            if (!enemy.active || !enemy.canBeTargeted) return

            detonate(enemy.x, enemy.y)
        }
        const updateProjectile = (_time: number, delta: number) => {
            if (!hitbox.active || !graphic.active) {
                cleanup()
                return
            }

            trail.unshift({ x: hitbox.x, y: hitbox.y, age: 0 })
            for (const point of trail) point.age += delta
            while (trail.length > 12 || trail[trail.length - 1]?.age > 280) trail.pop()
            this.drawNeutronProjectile(graphic, hitbox.x, hitbox.y, starRadius, trail)
        }
        const cleanup = (destroyHitbox = true, destroyGraphic = true) => {
            if (cleaned) return
            cleaned = true
            this.scene.events.off("update", updateProjectile)
            this.scene.events.off("gamestate", cleanup)
            overlap?.destroy()
            wallCollider?.destroy()
            lifespanTimer?.remove(false)
            this.activeFxCleanups.delete(cleanup)

            if (destroyHitbox && hitbox.active) this.destroyRoundFx(hitbox)
            if (destroyGraphic && graphic.active) this.destroyRoundFx(graphic)
        }

        hitbox.once("destroy", () => cleanup(false, true))
        graphic.once("destroy", () => cleanup(true, false))
        this.scene.events.on("update", updateProjectile)
        this.scene.events.once("gamestate", cleanup)
        overlap = this.scene.physics.add.overlap(hitbox, this.getEnemyTeam(), detonateOnEnemy)
        wallCollider = this.scene.physics.add.collider(hitbox, this.scene.walls, () => detonate())
        lifespanTimer = this.scene.time.delayedCall(2200, detonate)
        this.activeFxCleanups.add(cleanup)

        const angle = Phaser.Math.Angle.Between(startX, startY, target.x, target.y - 12)
        this.scene.physics.velocityFromRotation(angle, ROBILTON_NEUTRON_STAR_SPEED, body.velocity)
    }

    private drawNeutronProjectile(graphic: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, trail: TrailPoint[]): void {
        graphic.clear()
        for (let index = trail.length - 1; index >= 0; index--) {
            const point = trail[index]
            const alpha = Phaser.Math.Clamp(1 - point.age / 300, 0, 1)
            const size = radius * (0.35 + alpha * 0.5)

            graphic.fillStyle(neutronPurpleColor, 0.12 * alpha)
            graphic.fillCircle(point.x, point.y, size * 2.2)
            graphic.fillStyle(neutronBrightColor, 0.28 * alpha)
            graphic.fillCircle(point.x, point.y, size)
        }

        graphic.fillStyle(neutronPurpleColor, 0.28)
        graphic.fillCircle(x, y, radius * 2.4)
        graphic.fillStyle(neutronDarkColor, 0.92)
        graphic.fillCircle(x, y, radius * 1.12)
        graphic.fillStyle(neutronPurpleColor, 0.86)
        graphic.fillCircle(x, y, radius * 0.72)
        graphic.fillStyle(gravityOrbCoreColor, 0.95)
        graphic.fillCircle(x - radius * 0.16, y - radius * 0.18, radius * 0.22)
    }

    private detonateNeutronStar(x: number, y: number, multiplier: number): void {
        if (!this.active || this.scene.state !== "fighting") return

        const radius = calculateRobiltonExplosionRadius(this.abilityPower)
        const affected = this.getEnemyTeam()
            .getChildren(true, true)
            .filter((enemy) => enemy.active && enemy.canBeTargeted && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius)

        for (const enemy of affected) {
            if (this.scene.state !== "fighting") return

            const { value, crit } = this.calculateDamage(calculateRobiltonExplosionDamage(this.abilityPower, multiplier))
            enemy.takeDamage(value, this, "dark", crit, true, this.abilityName)
            if (this.scene.state !== "fighting") return

            const stacks = this.consumeGravityOrbs(enemy)
            if (stacks > 0 && enemy.active) {
                const orbDamage = this.calculateDamage(calculateRobiltonGravityOrbDamage(this.abilityPower, stacks, multiplier))
                enemy.takeDamage(orbDamage.value, this, "dark", orbDamage.crit, true, `${this.abilityName}: Orbes de Gravidade`)
                if (this.scene.state !== "fighting") return
            }
        }

        if (!this.active || this.scene.state !== "fighting") return

        this.drawNeutronExplosion(x, y, radius)
        this.createBlackHole(x, y)
    }

    private drawNeutronExplosion(x: number, y: number, radius: number): void {
        const graphic = this.scene.add.graphics().setDepth(this.depth + 13).setBlendMode(Phaser.BlendModes.ADD)
        let cleaned = false
        let tween: Phaser.Tweens.Tween | undefined

        this.trackRoundFx(graphic)

        const cleanup = () => {
            if (cleaned) return
            cleaned = true
            this.scene.events.off("gamestate", stopFx)
            if (tween) {
                tween.stop()
                this.scene.tweens.remove(tween)
                tween = undefined
            }
            if (graphic.active) this.destroyRoundFx(graphic)
        }
        const stopFx = () => cleanup()

        graphic.once("destroy", cleanup)
        this.scene.events.once("gamestate", stopFx)
        tween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 320,
            ease: "Sine.easeIn",
            onUpdate: (activeTween: Phaser.Tweens.Tween) => {
                const progress = activeTween.getValue() as number
                const implosion = 1 - progress
                const currentRadius = radius * implosion
                const alpha = Phaser.Math.Clamp(implosion, 0, 1)

                graphic.clear()
                graphic.fillStyle(neutronPurpleColor, 0.18 * alpha)
                graphic.fillCircle(x, y, currentRadius)
                graphic.lineStyle(7, neutronBrightColor, 0.32 * alpha)
                graphic.strokeCircle(x, y, currentRadius * 0.72)
                graphic.lineStyle(2, gravityOrbCoreColor, 0.72 * alpha)
                graphic.strokeCircle(x, y, currentRadius * 0.38)
                for (let index = 0; index < 10; index++) {
                    const angle = index * 0.628 + progress * 3
                    const startRadius = currentRadius * (0.35 + (index % 4) * 0.12)
                    graphic.lineStyle(1.5, neutronBrightColor, 0.36 * alpha)
                    graphic.lineBetween(x + Math.cos(angle) * startRadius, y + Math.sin(angle) * startRadius, x, y)
                }
            },
            onComplete: cleanup,
            onStop: cleanup,
        })
    }

    private createBlackHole(x: number, y: number): void {
        const graphic = this.scene.add.graphics().setDepth(this.depth + 12).setBlendMode(Phaser.BlendModes.ADD)
        const radius = calculateRobiltonBlackHoleRadius(this.abilityPower)
        const pullStrength = calculateRobiltonBlackHolePullStrength(this.abilityPower)
        const startedAt = this.scene.time.now
        let cleaned = false
        let timer: Phaser.Time.TimerEvent | undefined

        this.trackRoundFx(graphic)

        const updateBlackHole = (time: number, delta: number) => {
            const progress = Phaser.Math.Clamp((time - startedAt) / ROBILTON_BLACK_HOLE_DURATION_MS, 0, 1)
            this.pullEnemiesToBlackHole(x, y, pullStrength, delta)
            this.pullProjectilesToBlackHole(x, y, pullStrength, delta)
            this.drawBlackHole(graphic, x, y, radius, progress, time)
        }
        const cleanup = () => {
            if (cleaned) return
            cleaned = true
            this.scene.events.off("update", updateBlackHole)
            this.scene.events.off("gamestate", cleanup)
            timer?.remove(false)
            this.activeFxCleanups.delete(cleanup)
            if (graphic.active) this.destroyRoundFx(graphic)
        }

        graphic.once("destroy", cleanup)
        this.scene.events.on("update", updateBlackHole)
        this.scene.events.once("gamestate", cleanup)
        timer = this.scene.time.delayedCall(ROBILTON_BLACK_HOLE_DURATION_MS, cleanup)
        this.activeFxCleanups.add(cleanup)
    }

    private pullEnemiesToBlackHole(x: number, y: number, pullStrength: number, delta: number): void {
        const pullDistance = pullStrength * (delta / 1000)

        for (const enemy of this.getEnemyTeam().getChildren(true, true)) {
            if (!enemy.active) continue

            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y)
            if (distance <= 1) continue

            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, x, y)
            const step = Math.min(distance, pullDistance)
            enemy.setPosition(enemy.x + Math.cos(angle) * step, enemy.y + Math.sin(angle) * step)
        }
    }

    private pullProjectilesToBlackHole(x: number, y: number, pullStrength: number, delta: number): void {
        const frameScale = delta / 1000
        const projectilePullStrength = pullStrength * 3

        for (const child of this.scene.children.list) {
            if (!(child instanceof Projectile)) continue
            if (!child.active || !child.body) continue

            const angle = Phaser.Math.Angle.Between(child.x, child.y, x, y)
            child.body.velocity.x += Math.cos(angle) * projectilePullStrength * frameScale
            child.body.velocity.y += Math.sin(angle) * projectilePullStrength * frameScale
        }
    }

    private drawBlackHole(graphic: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, progress: number, time: number): void {
        const pulse = (Math.sin(time * 0.012) + 1) * 0.5
        const alpha = Phaser.Math.Clamp(1 - progress * 0.35, 0.5, 1)

        graphic.clear()
        graphic.fillStyle(neutronPurpleColor, 0.08 * alpha)
        graphic.fillCircle(x, y, radius)
        graphic.lineStyle(7, neutronPurpleColor, 0.2 * alpha)
        graphic.strokeCircle(x, y, radius * (0.68 + pulse * 0.08))
        graphic.lineStyle(3, neutronBrightColor, 0.32 * alpha)
        graphic.strokeCircle(x, y, radius * (0.42 + pulse * 0.06))
        graphic.fillStyle(neutronDarkColor, 0.94)
        graphic.fillCircle(x, y, radius * 0.22)
        graphic.fillStyle(neutronPurpleColor, 0.5)
        graphic.fillCircle(x, y, radius * 0.13)

        for (let index = 0; index < 14; index++) {
            const angle = time * 0.004 + index * 0.9
            const orbit = radius * (0.25 + ((index * 13) % 53) / 100)
            const particleX = x + Math.cos(angle) * orbit
            const particleY = y + Math.sin(angle) * orbit * 0.72
            graphic.fillStyle(index % 2 === 0 ? neutronBrightColor : gravityOrbColor, 0.28 * alpha)
            graphic.fillCircle(particleX, particleY, 1.8 + pulse * 1.2)
        }
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

    override destroy(fromScene?: boolean): void {
        this.cleanupActiveFx()
        this.clearGravityOrbs()
        this.gravityOrbGraphic?.destroy(true)
        this.gravityOrbGraphic = undefined

        super.destroy(fromScene)
    }
}

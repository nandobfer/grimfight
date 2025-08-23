// src/game/characters/Character.ts
import Phaser from "phaser"
import { Game } from "../scenes/Game"
import { ProgressBar } from "../ui/ProgressBar"
import { spawnParrySpark } from "../fx/Parry"
import { EventBus } from "../tools/EventBus"
import { DamageType, showDamageText } from "../ui/DamageNumbers"
import { CreatureGroup } from "./CreatureGroup"

export type Direction = "left" | "up" | "down" | "right"

export class Creature extends Phaser.Physics.Arcade.Sprite {
    facing: Direction = "down"
    target?: Creature
    moving: boolean = true
    attacking: boolean = false
    casting = false
    avoidanceRange = 64
    originalDepth: number
    id: string
    team: CreatureGroup
    attackAnimationImpactFrame = 5
    minDamageMultiplier = 0.8
    maxDamageMultiplier = 1.2

    level = 1
    health = 0
    baseMaxHealth = 500
    baseAttackSpeed = 1
    baseAttackDamage = 10
    baseAttackRange = 1
    mana = 0
    baseMaxMana = 100
    baseManaPerSecond = 10
    baseManaPerAttack = 10
    baseArmor = 0
    baseResistance = 0
    baseSpeed = 30
    baseCritChance = 10
    baseCritDamageMultiplier = 2

    maxHealth = 0
    attackSpeed = 0
    attackDamage = 0
    attackRange = 0
    maxMana = 0
    manaPerSecond = 0
    manaPerAttack = 0
    armor = 0
    resistance = 0
    speed = 0
    critChance = 0
    critDamageMultiplier = 0

    boardX = 0
    boardY = 0

    experience = 0

    declare scene: Game
    declare body: Phaser.Physics.Arcade.Body

    effectPool: Phaser.GameObjects.Particles.ParticleEmitter[] = []
    activeEffects: Set<Phaser.GameObjects.Particles.ParticleEmitter> = new Set()
    particles?: Phaser.GameObjects.Particles.ParticleEmitter

    private healthBar: ProgressBar
    private manaBar: ProgressBar

    constructor(scene: Game, name: string, id: string) {
        super(scene, -1000, -1000, name)

        this.id = id
        this.name = name
        this.scene.add.existing(this)
        this.scene.physics.add.existing(this)
        this.setCollideWorldBounds(true)
        this.body.pushable = false
        this.originalDepth = this.depth

        this.createAnimations()

        this.anims.play(`${this.name}-idle-down`)

        this.healthBar = new ProgressBar(this, { color: 0x2ecc71, offsetY: -30, interpolateColor: true })
        this.manaBar = new ProgressBar(this, { color: 0x3498db, offsetY: -25 })

        this.setPipeline("Light2D")
    }

    reset() {
        this.calculateStats()
        this.health = this.maxHealth
        this.mana = 0
        this.active = true
        this.setRotation(0)
        this.resetUi()
        this.setDepth(this.originalDepth)
        this.updateFacingDirection()
        this.stopMoving()
        this.idle()

        this.active = true
        this.target = undefined
    }

    calculateStats() {
        this.maxHealth = this.baseMaxHealth
        this.attackSpeed = this.baseAttackSpeed
        this.attackDamage = this.baseAttackDamage
        this.attackRange = this.baseAttackRange
        this.maxMana = this.baseMaxMana
        this.manaPerSecond = this.baseManaPerSecond
        this.manaPerAttack = this.baseManaPerAttack
        this.armor = this.baseArmor
        this.resistance = this.baseResistance
        this.speed = this.baseSpeed
        this.critChance = this.baseCritChance
        this.critDamageMultiplier = this.baseCritDamageMultiplier
    }

    resetUi() {
        this.healthBar.reset()
        this.healthBar.setValue(this.maxHealth, this.maxHealth)
        this.manaBar.reset()
        this.manaBar.setValue(0, this.maxMana)
    }

    createAnimations() {
        this.extractAnimationsFromSpritesheet("walking", 104, 9)
        this.extractAnimationsFromSpritesheet("idle", 286, 2)
        this.extractAttackingAnimation()
    }
    // always 4 animations, top > left > down > right
    // 7) 0 - 52: spellcasting
    // 8) 53 - 103: thrusting
    // 9) 286 - 158: walking
    extractAnimationsFromSpritesheet(key: string, startingFrame: number, framesPerRow: number) {
        const directions: Direction[] = ["up", "left", "down", "right"]
        let currentFrameCount = startingFrame
        const offsetFrames = 13 - framesPerRow

        for (const direction of directions) {
            this.anims.create({
                key: `${this.name}-${key}-${direction}`,
                frames: this.anims.generateFrameNumbers(this.name, { start: currentFrameCount, end: currentFrameCount + framesPerRow - 1 }),
                frameRate: framesPerRow + 1,
                repeat: -1,
            })
            currentFrameCount += framesPerRow + offsetFrames
        }
    }

    extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 52, 8)
        this.extractAnimationsFromSpritesheet("attacking2", 156, 6)
    }

    onHealFx() {
        const healEffect = this.scene.add.sprite(this.x, this.y, "heal4")
        healEffect.setDepth(this.depth + 1) // Make sure it appears above the character
        healEffect.setScale(0.5)
        healEffect.play("heal4")
        const followCharacter = () => {
            if (healEffect.active) {
                healEffect.setPosition(this.x, this.y)
            }
        }

        // Update position each frame
        this.scene.events.on("update", followCharacter)

        // Clean up when animation completes
        healEffect.once("animationcomplete", () => {
            this.scene.events.off("update", followCharacter)
            healEffect.destroy()
        })

        // Also clean up if character is destroyed first
        this.once("destroy", () => {
            if (healEffect.active) {
                this.scene.events.off("update", followCharacter)
                healEffect.destroy()
            }
        })
    }

    onHitFx() {
        const particles = this.scene.add.particles(this.x, this.y, "blood", {
            lifespan: 600,
            speed: { min: 30, max: 80 },
            scale: { start: 0.15, end: 0 },
            quantity: 5,
            blendMode: "NORMAL",
            frequency: -1,
        })

        particles.explode(10)

        this.scene.time.delayedCall(600, () => {
            particles.destroy()
        })
    }

    spawnParryngEffect(attacker: Creature) {
        const ang = Phaser.Math.Angle.Between(attacker.x, attacker.y, this.x, this.y)
        spawnParrySpark(this.scene, this.x, this.y, ang)
    }

    resetMouseEvents() {
        this.clearMouseEvents()
        this.handleMouseEvents()
    }

    clearMouseEvents() {
        this.off("pointerover")
        this.off("pointerout")
        this.off("drag")
    }

    handleMouseEvents() {
        this.setInteractive({ useHandCursor: true })
        // this.scene.input.enableDebug(this)
    }

    getOppositeDirection(): Direction {
        switch (this.facing) {
            case "down":
                return "up"
            case "up":
                return "down"
            case "left":
                return "right"
            case "right":
                return "left"
        }
    }

    private findEnemyByDistance(closest = true): Creature | undefined {
        const enemyTeam = this.getEnemyTeam()
        const enemies = enemyTeam.getChildren()
        let chosenEnemy: Creature | undefined = undefined
        let closestEnemyDistance = 0
        for (const enemy of enemies) {
            if (!enemy.active) {
                continue
            }
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
            if (!chosenEnemy) {
                chosenEnemy = enemy
                closestEnemyDistance = distance
                continue
            }

            if (closest) {
                if (distance < closestEnemyDistance) {
                    chosenEnemy = enemy
                    closestEnemyDistance = distance
                }
            } else {
                if (distance > closestEnemyDistance) {
                    chosenEnemy = enemy
                    closestEnemyDistance = distance
                }
            }
        }

        return chosenEnemy
    }

    getClosestEnemy() {
        return this.findEnemyByDistance(true)
    }

    getFartestEnemy() {
        return this.findEnemyByDistance(false)
    }

    newTarget() {
        this.stopMoving()
        this.idle()

        this.target = this.getClosestEnemy()
        this.updateFacingDirection()
    }

    idle() {
        this.play(`${this.name}-idle-${this.facing}`, true)
    }

    stopMoving() {
        this.moving = false
        this.setVelocity(0, 0)
    }

    moveToTarget() {
        if (!this.target || !this.target.active) {
            this.target = undefined
            this.idle()
            return
        }

        // Calculate direction vector
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)

        // Set velocity based on direction
        this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), this.speed, this.body?.velocity)

        // Update facing direction based on movement
        this.updateFacingDirection()

        // Play appropriate walking animation
        this.play(`${this.name}-walking-${this.facing}`, true)
    }

    getEnemyTeam() {
        return this.scene.playerTeam.contains(this) ? this.scene.enemyTeam : this.scene.playerTeam
    }

    removeFromEnemyTarget() {
        for (const enemy of this.getEnemyTeam().getChildren()) {
            if (enemy.target === this) {
                enemy.target = undefined
            }
        }
    }

    updateFacingDirection() {
        if (!this.target) {
            this.facing = "down"
            return
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)

        // Convert angle to degrees (0-360) for easier direction calculation
        const degrees = Phaser.Math.RadToDeg(angle)

        // Determine facing direction based on angle sectors
        if (degrees >= -45 && degrees < 45) {
            this.facing = "right"
        } else if (degrees >= 45 && degrees < 135) {
            this.facing = "down"
        } else if (degrees >= 135 || degrees < -135) {
            this.facing = "left"
        } else {
            this.facing = "up"
        }
    }

    handleCollisionWithEnemy() {
        if (!this.target) return

        this.stopMoving()
        this.idle()
    }

    startMoving() {
        this.moving = true
    }

    isInAttackRange(): boolean {
        if (!this.target) return false

        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y)

        return distance <= this.attackRange * 64
    }

    avoidOtherCharacters() {
        if (!this.target) return

        // Calculate desired movement toward target
        const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)
        const desiredVelocity = new Phaser.Math.Vector2(Math.cos(angleToTarget) * this.speed, Math.sin(angleToTarget) * this.speed)

        // Check for immediate obstacles in front
        const frontCheckDistance = 30
        const frontCheckPoint = new Phaser.Math.Vector2(
            this.x + Math.cos(angleToTarget) * frontCheckDistance,
            this.y + Math.sin(angleToTarget) * frontCheckDistance
        )

        // Find closest character in front
        const allCharacters = [...this.scene.playerTeam.getChildren(), ...this.scene.enemyTeam.getChildren()].filter(
            (c) => (c as unknown) !== this && c.active
        ) as Creature[]

        let closestInFront: Creature | null = null
        let minDistance = Number.MAX_VALUE

        for (const other of allCharacters) {
            const distance = Phaser.Math.Distance.Between(frontCheckPoint.x, frontCheckPoint.y, other.x, other.y)

            if (distance < other.body.width / 2 + 10 && distance < minDistance) {
                closestInFront = other
                minDistance = distance
            }
        }

        // If obstacle in front, adjust path
        if (closestInFront) {
            // Calculate angle to go around the obstacle (left or right)
            const angleToObstacle = Phaser.Math.Angle.Between(this.x, this.y, closestInFront.x, closestInFront.y)

            // Choose shortest path around (left or right)
            const goLeft =
                Phaser.Math.Angle.ShortestBetween(angleToTarget, angleToObstacle - Math.PI / 2) <
                Phaser.Math.Angle.ShortestBetween(angleToTarget, angleToObstacle + Math.PI / 2)

            const avoidAngle = angleToObstacle + (goLeft ? -Math.PI / 2 : Math.PI / 2)

            // Blend desired velocity with avoidance
            desiredVelocity.x = Math.cos(avoidAngle) * this.speed * 0.7 + desiredVelocity.x * 0.3
            desiredVelocity.y = Math.sin(avoidAngle) * this.speed * 0.7 + desiredVelocity.y * 0.3
        }

        // Apply final velocity
        this.setVelocity(desiredVelocity.x, desiredVelocity.y)
        this.updateFacingDirection()
        this.play(`${this.name}-walking-${this.facing}`, true)
    }

    startAttack() {
        if (this.attacking || !this.target?.active) {
            return
        }

        this.updateFacingDirection()
        this.attacking = true
        const spriteVariant = Phaser.Math.RND.weightedPick([1, 2])
        const animKey = `${this.name}-attacking${spriteVariant}-${this.facing}`
        const anim = this.anims.get(animKey)

        const onUpdate = (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
            if (animation.key !== animKey) return
            if (frame.index === this.attackAnimationImpactFrame) {
                this.landAttack()
            }
        }

        this.on("animationupdate", onUpdate)

        this.play({ key: animKey, frameRate: anim.frames.length * this.attackSpeed, repeat: 0 }, true)

        const cleanup = () => {
            this.off("animationupdate", onUpdate)
            this.attacking = false
        }
        this.once("animationcomplete", cleanup)
        this.once("animationstop", cleanup)
    }

    landAttack() {
        this.onAttackLand("normal")
    }

    onAttackLand(damagetype: DamageType, target?: Creature) {
        const victim = target ?? this.target
        if (!victim?.active) return 0

        const isCrit = Phaser.Math.FloatBetween(0, 100) <= this.critChance
        let damageMultiplier = 0

        if (isCrit) {
            damageMultiplier += this.critDamageMultiplier
        }

        const randomizedDamage = this.attackDamage * Phaser.Math.FloatBetween(this.minDamageMultiplier, this.maxDamageMultiplier)
        const damage = randomizedDamage * Math.max(1, damageMultiplier)

        victim.takeDamage(damage, this, "bleeding", { crit: isCrit, type: damagetype })
        this.gainMana(this.manaPerAttack)

        return damage
    }

    heal(value: number) {
        this.health = Math.min(this.maxHealth, this.health + value)
        this.healthBar.setValue(this.health, this.maxHealth)

        showDamageText(this.scene, this.x, this.y, Math.round(value), { type: "heal" })
        this.onHealFx()
    }

    takeDamage(damage: number, attacker: Creature, effect = "bleeding", opts?: { crit?: boolean; type: DamageType }) {
        const incomingDamage = damage - this.armor
        const resistanceMultiplier = 1 - this.resistance / 100
        const finalDamage = Math.max(0, incomingDamage * resistanceMultiplier)

        showDamageText(this.scene, this.x, this.y, Math.round(finalDamage), { crit: !!opts?.crit, type: finalDamage <= 0 ? "block" : opts?.type })

        this.health -= finalDamage
        this.healthBar.setValue(this.health, this.maxHealth)
        if (this.health <= 0) {
            this.die()
            return
        }

        if (finalDamage === 0) {
            this.spawnParryngEffect(attacker)
        } else {
            this.onHitFx()
        }
    }

    die() {
        if (this.facing === "left" || this.facing === "up") {
            this.facing = "left"
            this.setRotation(1.571)
        }

        if (this.facing === "right" || this.facing === "down") {
            this.facing = "right"
            this.setRotation(-1.571)
        }
        this.stopMoving()
        this.idle()
        this.anims.stop()
        this.active = false
        this.setDepth(this.depth - 1)
        this.onDieFx()
        this.healthBar.fadeOut()
        this.manaBar.fadeOut()
        this.active = false
    }

    onDieFx() {
        const poolSize = Phaser.Math.FloatBetween(0.3, 0.8)

        const bloodPool = this.scene.add
            .image(this.x, this.y + 10, "blood")
            .setDepth(this.depth - 1)
            .setScale(poolSize)
            .setAlpha(0)
            .setRotation(Phaser.Math.FloatBetween(0, 2 * 3.14))
        bloodPool.setPipeline("Light2D")
        bloodPool.state = this.scene.floor

        this.scene.tweens.add({
            targets: bloodPool,
            alpha: 0.95,
            duration: Phaser.Math.FloatBetween(500, 1000),
            ease: "Sine.easeIn",
        })

        const removePool = (floor: number) => {
            if (bloodPool.state !== floor) {
                bloodPool.destroy(true)
                EventBus.off("gameover", removePool)
            }
        }

        EventBus.on("floor-change", removePool)
    }

    gainMana(manaGained: number) {
        this.mana = Math.min(this.mana + manaGained, this.maxMana)
        this.manaBar?.setValue(this.mana, this.maxMana)

        if (this.mana === this.maxMana) {
            this.startCastingAbility()
        }
    }

    regenMana(delta: number) {
        const passedSeconds = delta / 1000
        const manaGained = this.manaPerSecond * passedSeconds
        this.gainMana(manaGained)
    }

    startCastingAbility() {
        this.attacking = true
        this.gainMana(-this.mana)

        this.castAbility()

        // failsafe
        if (!this.casting) {
            this.attacking = false
        }
    }

    castAbility() {
        // each character and monster will have it's own
    }

    destroyUi() {
        this.healthBar.destroy()
        this.manaBar.destroy()
    }

    selfUpdate(delta: number) {
        if (this.health <= 0) {
            this.die()
        }

        this.regenMana(delta)
    }

    withTargetUpdate() {
        if (!this.target?.active) {
            this.newTarget()
            return
        }

        if (this.isInAttackRange()) {
            this.stopMoving()
            this.startAttack()
        } else {
            if (!this.attacking) {
                this.moveToTarget()
                this.avoidOtherCharacters()
            }
        }
    }

    updateCharUi() {
        if (this.health > 0 && this.scene.state === "idle") {
            this.resetUi()
        }
        this.healthBar.updatePosition()
        this.manaBar.updatePosition()
    }

    override update(time: number, delta: number): void {
        this.updateCharUi()

        if (this.scene.state === "idle") {
            return
        }

        if (this.target) {
            this.withTargetUpdate()
        } else {
            this.newTarget()
        }

        this.selfUpdate(delta)
    }
}

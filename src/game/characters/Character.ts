// src/game/characters/Character.ts
import Phaser from "phaser"
import { Game } from "../scenes/Game"
import { ProgressBar } from "../ui/ProgressBar"
import { spawnParrySpark } from "../fx/Parry"
import { EventBus } from "../tools/EventBus"
import { LevelBadge } from "../ui/LevelBadge"
import { DamageType, showDamageText } from "../ui/DamageNumbers"
import { CharacterGroup } from "./CharacterGroup"

export type Direction = "left" | "up" | "down" | "right"

export interface CharacterDto {
    level: number
    name: string
    id: string
    isPlayer: boolean
    maxHealth: number
    attackSpeed: number
    attackDamage: number
    attackRange: number
    maxMana: number
    manaPerSecond: number
    manaPerAttack: number
    armor: number
    resistance: number
    speed: number
    critChance: number
    critDamageMultiplier: number
    boardX: number
    boardY: number
}

export class Character extends Phaser.Physics.Arcade.Sprite {
    facing: Direction = "down"
    target?: Character
    moving: boolean = true
    isAttacking: boolean = false
    avoidanceRange = 64
    originalDepth: number
    id: string
    isPlayer: boolean = false
    team: CharacterGroup

    level = 1
    health = 0
    maxHealth = 100
    attackSpeed = 1
    attackDamage = 10
    attackRange = 1
    mana = 0
    maxMana = 100
    manaPerSecond = 10
    manaPerAttack = 10
    armor = 0
    resistance = 0
    speed = 30
    critChance = 10
    critDamageMultiplier = 2

    boardX = 0
    boardY = 0

    experience = 0

    declare scene: Game
    declare body: Phaser.Physics.Arcade.Body

    private glowFx: Phaser.FX.Glow

    effectPool: Phaser.GameObjects.Particles.ParticleEmitter[] = []
    activeEffects: Set<Phaser.GameObjects.Particles.ParticleEmitter> = new Set()
    particles?: Phaser.GameObjects.Particles.ParticleEmitter

    private preDrag?: { x: number; y: number }

    private healthBar: ProgressBar
    private manaBar: ProgressBar
    private levelBadge!: LevelBadge

    constructor(scene: Game, x: number, y: number, name: string, id: string) {
        super(scene, x, y, name)

        this.id = id
        this.name = name
        this.scene.add.existing(this)
        this.scene.physics.add.existing(this)
        this.setCollideWorldBounds(true)
        this.body.pushable = false
        this.originalDepth = this.depth
        this.boardX = x
        this.boardY = y

        this.createAnimations()

        this.on("animationupdate", this.handleAnimationUpdate, this)

        this.glowFx = this.postFX.addGlow(0xffffff, 8, 0) // White glow
        this.glowFx.outerStrength = 0

        this.anims.play(`${this.name}-idle-down`)

        this.healthBar = new ProgressBar(this, { color: 0x2ecc71, offsetY: -30, interpolateColor: true })
        this.manaBar = new ProgressBar(this, { color: 0x3498db, offsetY: -25 })
        this.levelBadge = new LevelBadge(this, { offsetX: 22, offsetY: -15 })
        this.levelBadge.setValue(this.level)
        this.setPipeline("Light2D")
    }

    loadFromDto(dto: CharacterDto) {
        for (const [key, value] of Object.entries(dto)) {
            this[key as keyof this] = value
        }
    }

    reset() {
        this.health = this.maxHealth
        this.mana = 0
        this.active = true
        this.setRotation(0)
        this.resetUi()
        this.setDepth(this.originalDepth)
        this.updateFacingDirection()
        this.stopMoving()
        this.idle()
        this.levelBadge.reset()
        this.target = undefined

        if (this.isPlayer && this.boardX && this.boardY) {
            this.x = this.boardX
            this.y = this.boardY
        }
    }

    resetUi() {
        this.healthBar.reset()
        this.healthBar.setValue(this.maxHealth, this.maxHealth)
        this.manaBar.reset()
        this.manaBar.setValue(0, this.maxMana)
        this.levelBadge.reset()
    }

    saveInStorage() {
        const dto = this.getDto()
        const characters = this.scene.getSavedCharacters()
        const index = characters.findIndex((c) => c.id === this.id)

        if (index >= 0) {
            characters[index] = dto // Update the array element
        } else {
            characters.push(dto) // Add new character
        }
        this.scene.savePlayerCharacters(characters)
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

    handleAnimationUpdate(animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) {
        this.triggerEffectonTarget(animation, frame, "bleeding", "attacking1", 5)
        this.triggerEffectonTarget(animation, frame, "bleeding", "attacking2", 5)
    }

    triggerEffectonTarget(
        animation: Phaser.Animations.Animation,
        frame: Phaser.Animations.AnimationFrame,
        effect: string,
        animationKey: string,
        onFrame: number
    ) {
        if (animation.key.includes(animationKey) && frame.index === onFrame && this.target) {
            this.onAttack("normal")
        }
    }

    spawnHitEffect(effectType: string) {
        if (effectType === "bleeding") {
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
    }

    spawnParryngEffect(attacker: Character) {
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
        this.setInteractive({ useHandCursor: true, draggable: true })
        // this.scene.input.enableDebug(this)

        if (this.isPlayer) {
            this.scene.input.setDraggable(this)

            this.on("pointerover", () => {
                if (this.scene.state === "idle") {
                    this.animateGlow(5)
                }
            })

            this.on("pointerout", () => {
                this.animateGlow(0)
            })

            this.on("dragstart", (pointer: Phaser.Input.Pointer) => {
                if (this.scene.state !== "idle") return
                // remember original pos in case drop is invalid
                this.preDrag = { x: this.x, y: this.y }
                // show allowed tiles overlay immediately
                this.scene.grid.showDropOverlay()
                this.scene.grid.showHighlightAtWorld(pointer.worldX, pointer.worldY)
            })

            this.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                if (this.scene.state !== "idle") return
                this.setPosition(dragX, dragY)
                this.scene.grid.showHighlightAtWorld(pointer.worldX, pointer.worldY)
            })

            this.on("dragend", (pointer: Phaser.Input.Pointer) => {
                if (this.scene.state !== "idle") return
                // Snap to tile center at drop
                const snapped = this.scene.grid.snapCharacter(this, pointer.worldX, pointer.worldY)
                if (snapped) {
                    this.boardX = this.x
                    this.boardY = this.y
                    this.saveInStorage()
                }

                if (!snapped && this.preDrag) {
                    // revert if dropped outside allowed rows
                    this.setPosition(this.preDrag.x, this.preDrag.y)
                    this.body?.reset(this.preDrag.x, this.preDrag.y)
                }
                this.scene.grid.hideHighlight()
                this.scene.grid.hideDropOverlay()
                this.preDrag = undefined
            })

            // this.on("drag", (_: never, x: number, y: number) => {
            //     if (this.scene.state === "idle") {
            //         this.setPosition(x, y)
            //     }
            // })
        }
    }

    private animateGlow(targetStrength: number) {
        if (!this.glowFx) return

        this.scene.tweens.add({
            targets: this.glowFx,
            outerStrength: targetStrength,
            duration: 250, // Animation duration (ms)
            ease: "Sine.easeOut", // Smooth easing
        })
    }

    newTarget() {
        this.stopMoving()
        this.idle()
        const enemyTeam = this.scene.playerTeam.contains(this) ? this.scene.enemyTeam : this.scene.playerTeam
        const enemies = enemyTeam.getChildren()
        let closestEnemy: Character | undefined = undefined
        let closestEnemyDistance = 0
        for (const enemy of enemies) {
            if (!enemy.active) {
                continue
            }
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
            if (!closestEnemy) {
                closestEnemy = enemy
                closestEnemyDistance = distance
                continue
            }

            if (distance < closestEnemyDistance) {
                closestEnemy = enemy
                closestEnemyDistance = distance
            }
        }

        this.target = closestEnemy
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
            (c) => c !== this && c.active
        ) as Character[]

        let closestInFront: Character | null = null
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

    handleAttack() {
        if (this.isAttacking || !this.target?.active) {
            return
        }

        this.updateFacingDirection()
        this.isAttacking = true
        const spriteVariant = Phaser.Math.RND.weightedPick([1, 2])
        const animKey = `${this.name}-attacking${spriteVariant}-${this.facing}`
        const anim = this.anims.get(animKey)

        this.play({ key: animKey, frameRate: anim.frames.length * this.attackSpeed, repeat: 0 }, true)

        this.once("animationcomplete", () => {
            this.isAttacking = false
        })
        this.once("animationstop", () => {
            this.isAttacking = false
        })
    }

    onAttack(damagetype: DamageType) {
        if (!this.target) return
        let damageMultiplier = 0

        const isCrit = Phaser.Math.FloatBetween(0, 100) <= this.critChance
        if (isCrit) {
            damageMultiplier += this.critDamageMultiplier
        }
        const damage = this.attackDamage * Math.max(1, damageMultiplier)
        this.target.takeDamage(damage, this, "bleeding", { crit: isCrit, type: damagetype })
        this.gainMana(this.manaPerAttack)
        this.team.damageChart.plotDamage(this, damage)
    }

    takeDamage(damage: number, attacker: Character, effect = "bleeding", opts?: { crit?: boolean; type: DamageType }) {
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
            this.spawnHitEffect(effect)
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
        this.createBloodPool()
        this.healthBar.fadeOut()
        this.manaBar.fadeOut()
        this.levelBadge.fadeOut()
    }

    private createBloodPool() {
        const poolSize = Phaser.Math.FloatBetween(0.3, 0.8)

        const bloodPool = this.scene.add
            .image(this.x, this.y + 10, "blood")
            .setDepth(this.depth - 1)
            .setScale(poolSize)
            .setAlpha(0)
            .setRotation(Phaser.Math.FloatBetween(0, 2 * 3.14))
        bloodPool.setPipeline("Light2D")

        this.scene.tweens.add({
            targets: bloodPool,
            alpha: 0.95,
            duration: Phaser.Math.FloatBetween(500, 1000),
            ease: "Sine.easeIn",
        })
    }

    gainMana(manaGained: number) {
        this.mana += manaGained
        this.manaBar.setValue(this.mana, this.maxMana)
    }

    regenMana(delta: number) {
        const passedSeconds = delta / 1000
        const manaGained = this.manaPerSecond * passedSeconds
        this.gainMana(manaGained)
    }

    destroyUi() {
        this.healthBar.destroy()
        this.manaBar.destroy()
        this.levelBadge.destroy()
    }

    increaseExp() {
        this.experience += 1

        if (this.experience === this.level * 2) {
            this.levelUp()
        }

        this.saveInStorage()
    }

    levelUp() {
        this.experience = 0
        this.level += 1

        this.maxHealth += 50
        this.attackDamage += 5
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
            this.handleAttack()
        } else {
            if (!this.isAttacking) {
                this.moveToTarget()
                this.avoidOtherCharacters()
            }
        }
    }

    updateCharUi() {
        this.healthBar.updatePosition()
        this.manaBar.updatePosition()
        this.levelBadge.updatePosition()
    }

    update(time: number, delta: number): void {
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
        EventBus.emit(`character-${this.id}-update`, this)
    }

    getDto() {
        const data: CharacterDto = {
            level: this.level,
            armor: this.armor,
            attackDamage: this.attackDamage,
            attackRange: this.attackRange,
            attackSpeed: this.attackSpeed,
            boardX: this.x,
            boardY: this.y,
            critChance: this.critChance,
            critDamageMultiplier: this.critDamageMultiplier,
            id: this.id,
            isPlayer: this.isPlayer,
            manaPerAttack: this.manaPerAttack,
            manaPerSecond: this.manaPerSecond,
            maxHealth: this.maxHealth,
            maxMana: this.maxMana,
            name: this.name,
            resistance: this.resistance,
            speed: this.speed,
        }
        return data
    }
}

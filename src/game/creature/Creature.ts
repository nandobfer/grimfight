// src/game/characters/Character.ts
import Phaser from "phaser"
import { Game } from "../scenes/Game"
import { ProgressBar } from "../ui/ProgressBar"
import { DamageType, showDamageText } from "../ui/DamageNumbers"
import { CreatureGroup } from "./CreatureGroup"
import { Heal } from "../fx/Heal"
import { burstBlood } from "../fx/Blood"
import { StatusEffect } from "../objects/StatusEffect"
import { Item } from "../systems/Items/Item"
import { ItemRegistry } from "../systems/Items/ItemRegistry"

export type Direction = "left" | "up" | "down" | "right"

export class Creature extends Phaser.Physics.Arcade.Sprite {
    facing: Direction = "down"
    target?: Creature
    moving: boolean = true
    attacking: boolean = false
    casting = false
    avoidanceRange = 64
    id: string
    team: CreatureGroup
    attackAnimationImpactFrame = 5
    minDamageMultiplier = 0.8
    maxDamageMultiplier = 1.2
    statusEffects = new Set<StatusEffect>()
    items = new Set<Item>()
    master?: Creature
    canBeTargeted = true

    level = 1
    health = 0
    baseScale = 1
    baseMaxHealth = 500
    baseAttackSpeed = 1
    baseAttackDamage = 10
    baseAbilityPower = 50
    baseAttackRange = 1
    mana = 0
    baseMaxMana = 100
    baseManaPerSecond = 10
    baseManaPerAttack = 10
    baseManaOnHit = 2
    /** incremental, base + x + y */
    baseArmor = 0
    baseSpeed = 50
    /** incremental, base + x + y */
    baseCritChance = 10
    baseCritDamageMultiplier = 2
    /** incremental, base + x + y */
    baseLifesteal = 0

    maxHealth = 0
    attackSpeed = 0
    attackDamage = 0
    attackRange = 0
    abilityPower = 0
    maxMana = 0
    manaPerSecond = 0
    manaPerAttack = 0
    /** incremental, base + x + y */
    armor = 0
    speed = 0
    /** incremental, base + x + y */
    critChance = 0
    critDamageMultiplier = 0
    /** incremental, base + x + y */
    lifesteal = 0
    manaOnHit = 0

    bonusAttackSpeed?: number
    bonusAttackDamage?: number

    manaLocked = false
    attackLocked = false
    moveLocked = false
    isRefreshing = false

    boardX = 0
    boardY = 0

    shield = 0

    declare scene: Game
    declare body: Phaser.Physics.Arcade.Body

    effectPool: Phaser.GameObjects.Particles.ParticleEmitter[] = []
    activeEffects: Set<Phaser.GameObjects.Particles.ParticleEmitter> = new Set()
    particles?: Phaser.GameObjects.Particles.ParticleEmitter

    private healthBar: ProgressBar
    private manaBar: ProgressBar
    aura?: Phaser.FX.Glow
    // tempGlow?: Phaser.FX.Glow

    eventHandlers: Record<string, Function> = {}
    timeEvents: Record<string, Phaser.Time.TimerEvent> = {}

    constructor(scene: Game, name: string, id: string, dataOnly = false) {
        super(scene, -1000, -1000, name)

        this.id = id
        this.name = name

        if (!dataOnly) {
            this.scene.add.existing(this)
            this.scene.physics.add.existing(this)
            this.setCollideWorldBounds(true)
            this.body.pushable = false
            this.setOrigin(0.5, 0.75)

            this.createAnimations()
            this.anims.play(`${this.name}-idle-down`)
            this.healthBar = new ProgressBar(this, { color: 0x2ecc71, offsetY: -30, interpolateColor: true })
            this.manaBar = new ProgressBar(this, { color: 0x3498db, offsetY: -25 })

            this.setPipeline("Light2D")
        }
    }

    reset() {
        this.calculateStats()
        this.setScale(this.baseScale)

        this.health = this.maxHealth
        this.mana = 0
        this.active = true
        this.setRotation(0)
        this.setAlpha(1)
        this.resetUi()
        this.updateFacingDirection()
        this.stopMoving()
        this.idle()
        this.updateDepth()
        this.items.forEach((item) => item.syncPosition(this))

        this.target = undefined
    }

    refreshStats() {
        if (this.isRefreshing) return
        this.isRefreshing = true
        try {
            this.reset()

            this.applyItems()
            this.applyAugments()
        } finally {
            this.isRefreshing = false
        }
    }

    applyItems() {
        this.items.forEach((item) => {
            item.cleanup(this)
            item.applyModifier(this)
        })
    }

    applyAugments() {
        const team = this.master?.team || this.team
        team?.augments?.forEach((augment) => augment.applyModifier(this))
    }

    calculateSpeeds() {
        this.attackSpeed = this.baseAttackSpeed
        this.speed = this.baseSpeed
    }

    calculateStats() {
        this.maxHealth = this.baseMaxHealth
        this.attackDamage = this.baseAttackDamage
        this.attackRange = this.baseAttackRange
        this.abilityPower = this.baseAbilityPower
        this.maxMana = this.baseMaxMana
        this.manaPerSecond = this.baseManaPerSecond
        this.manaPerAttack = this.baseManaPerAttack
        this.armor = this.baseArmor
        this.critChance = this.baseCritChance
        this.critDamageMultiplier = this.baseCritDamageMultiplier
        this.lifesteal = this.baseLifesteal
        this.manaOnHit = this.baseManaOnHit
        this.shield = 0
        this.calculateSpeeds()
    }

    getLevelMultiplier(min: number, base: number) {
        return Math.max(min, Math.pow(base, this.level - 1))
    }

    resetUi() {
        this.healthBar.reset()
        this.healthBar.setValue(this.maxHealth, this.maxHealth)
        this.healthBar.setShield(this.shield, this.health, this.maxHealth)
        this.manaBar.reset()
        this.manaBar.setValue(0, this.maxMana)
    }

    teleportTo(x: number, y: number) {
        this.setPosition(x, y)
        this.body.reset(x, y) // hard-sync body to sprite
        // this.setVelocity(0, 0) // clear any residual velocity
        // this.body.setAcceleration(0) // clear acceleration if used
    }

    getPlacement(): "front" | "middle" | "back" | null {
        const grid = this.scene.grid
        if (!grid) return null

        // prefer board coordinates when set; fallback to current position
        const wx = this.boardX > 0 && this.boardY > 0 ? this.boardX : this.x
        const wy = this.boardY > 0 ? this.boardY : this.y
        const cell = grid.worldToCell(wx, wy)
        if (!cell) return null

        // player side if in playerTeam or its minions; otherwise enemy side
        const onPlayerSide = this.scene.playerTeam.contains(this.master || this)

        return grid.getBandForRow(cell.row, onPlayerSide ? "player" : "enemy")
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
    extractAnimationsFromSpritesheet(
        key: string,
        startingFrame: number,
        usedFramesPerRow: number,
        totalFramesPerRow = 13,
        texture = this.name,
        identifier = this.name
    ) {
        const directions: Direction[] = ["up", "left", "down", "right"]
        let currentFrameCount = startingFrame
        const offsetFrames = totalFramesPerRow - usedFramesPerRow
        const animations: Phaser.Animations.Animation[] = []

        for (const direction of directions) {
            const animation = this.anims.create({
                key: `${identifier}-${key}-${direction}`,
                frames: this.anims.generateFrameNumbers(texture, { start: currentFrameCount, end: currentFrameCount + usedFramesPerRow - 1 }),
                frameRate: usedFramesPerRow + 1,
                repeat: -1,
            })
            currentFrameCount += usedFramesPerRow + offsetFrames
            if (animation) animations.push(animation)
        }

        return animations
    }

    extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 52, 8)
        this.extractAnimationsFromSpritesheet("attacking2", 156, 6)
    }

    randomPointAround(frontOnly = false) {
        // pick a radius in [min, max]
        const min = 40
        const max = 90
        const r = Phaser.Math.Between(min, max)

        // angle: either full 360° or a cone in front of the current facing
        let ang: number
        if (frontOnly) {
            const facingAngle = this.facing === "right" ? 0 : this.facing === "down" ? Math.PI / 2 : this.facing === "left" ? Math.PI : -Math.PI / 2
            const spread = Math.PI / 3 // ±60°
            ang = Phaser.Math.FloatBetween(facingAngle - spread, facingAngle + spread)
        } else {
            ang = Phaser.Math.FloatBetween(0, Math.PI * 2)
        }

        return { x: this.x + Math.cos(ang) * r, y: this.y + Math.sin(ang) * r }
    }

    addAura(color: number, maxIntensity: number) {
        this.aura = this.postFX.addGlow(color, 1, 0)
        this.aura.outerStrength = 6
        this.aura.innerStrength = 2

        this.scene.tweens.add({
            targets: this.aura,
            outerStrength: { from: 1, to: maxIntensity },
            innerStrength: { from: 1, to: maxIntensity },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        })
    }

    private tempGlow?: Phaser.FX.Glow
    private glowTween?: Phaser.Tweens.Tween
    private savedPipeline?: string
    glowTemporarily(color: number, intensity: number, duration: number) {
        // optional: avoid doing Lights + Glow at once
        if (!this.savedPipeline) this.savedPipeline = this.getPipelineName() as any
        this.resetPipeline() // drop Light2D for the flash to halve passes

        if (!this.tempGlow) this.tempGlow = this.postFX.addGlow(color, 0)
        try {
            ;(this.tempGlow as any).color = color
        } catch {}

        this.glowTween?.remove()
        this.tempGlow.outerStrength = 0
        this.tempGlow.innerStrength = 0

        this.glowTween = this.scene.tweens.add({
            targets: this.tempGlow,
            outerStrength: intensity,
            duration: duration * 0.5,
            yoyo: true,
            ease: "Sine.easeInOut",
            onComplete: () => {
                this.tempGlow!.outerStrength = 0
                // restore Lights if you use them
                if (this.savedPipeline) this.setPipeline(this.savedPipeline)
            },
        })
    }

    // glowTemporarily(color: number, intensity: number, duration: number) {
    //     this.tempGlow = this.postFX.addGlow(color, 0)

    //     this.scene.tweens.add({
    //         targets: this.tempGlow,
    //         duration: duration,
    //         yoyo: true,
    //         repeat: 0,
    //         outerStrength: intensity,
    //         ease: "Sine.easeInOut",
    //         onComplete: () => {
    //             this.tempGlow?.destroy()
    //             this.tempGlow = undefined
    //         },
    //     })
    // }

    removeAura() {
        this.aura?.destroy()
        this.aura = undefined
    }

    onHealFx() {
        const healEffect = new Heal(this)
    }

    applyStatusEffect(statusEffect: StatusEffect) {
        this.statusEffects.add(statusEffect)
    }

    resetMouseEvents() {
        this.clearMouseEvents()
        this.handleMouseEvents()
    }

    clearMouseEvents() {
        this.off("pointerover")
        this.off("pointerout")
        this.off("drag")
        this.off("pointerup")
        this.off("pointerdown")
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
        const enemies = enemyTeam.getChildren(true, true)
        let chosenEnemy: Creature | undefined = undefined
        let closestEnemyDistance = 0
        for (const enemy of enemies) {
            if (!enemy.active || !enemy.canBeTargeted) {
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
        this.play(`${this.getAnimationTextureName()}-idle-${this.facing}`, true)
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

        if (this.moveLocked) return

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)

        // Set velocity based on direction
        this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), this.speed, this.body?.velocity)
        this.updateFacingDirection()
        this.play(`${this.getAnimationTextureName()}-walking-${this.facing}`, true)
    }

    getEnemyTeam() {
        return this.scene.playerTeam.contains(this.master || this) ? this.scene.enemyTeam : this.scene.playerTeam
    }

    removeFromEnemyTarget(untargetable?: number) {
        for (const enemy of this.getEnemyTeam().getChildren()) {
            if (enemy.target === this) {
                enemy.target = undefined
            }
        }

        if (untargetable) {
            this.canBeTargeted = false
            this.scene.time.delayedCall(untargetable * 1000, () => {
                if (this) this.canBeTargeted = true
            })
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

    startMoving() {
        this.moving = true
    }

    calculateAttackRange() {
        return this.attackRange * 64
    }

    isInAttackRange(): boolean {
        if (!this.target) return false

        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y)

        return distance <= this.calculateAttackRange()
    }

    // - Prefers straight line if clear
    // - Chooses the side (left/right) with more clearance (shorter, safer detour)
    // - Small separation so units don’t stick together
    avoidOtherCharacters() {
        if (!this.target || this.moveLocked) return

        // ---------------- tuneables ----------------
        const FRONT_PROBE = 56 // how far ahead to check for direct path (px)
        const SIDE_PROBE = 72 // how far we check for detour feelers (px)
        const SIDE_ANGLE = Phaser.Math.DegToRad(45) // feeler spread
        const CLEAR_PAD = 8 // extra safety radius (px)
        const SEP_RANGE = 30 // start separating when closer than this (px)
        const SEP_WEIGHT = 0.6 // how strongly we apply separation (0..1)
        // -------------------------------------------

        const pos = new Phaser.Math.Vector2(this.x, this.y)
        const angToTarget = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)
        const fwd = new Phaser.Math.Vector2(Math.cos(angToTarget), Math.sin(angToTarget))

        // collect potential obstacles (alive, not self, roughly in front)
        const all = [...this.scene.playerTeam.getChildren(true), ...this.scene.enemyTeam.getChildren(true)].filter(
            (c: Creature) => c !== this && c.active
        ) as Creature[]

        // helper: radius for a creature
        const radiusOf = (c: Creature) => (c.body ? Math.max(c.body.width, c.body.height) / 2 : 16)

        // distance from segment p->q to point s (circle center)
        const segDist = (p: Phaser.Math.Vector2, q: Phaser.Math.Vector2, s: Phaser.Math.Vector2) => {
            const pq = q.clone().subtract(p)
            const ps = s.clone().subtract(p)
            const len2 = Math.max(1e-6, pq.lengthSq())
            const t = Phaser.Math.Clamp(ps.dot(pq) / len2, 0, 1)
            const proj = p.clone().add(pq.scale(t))
            return proj.distance(s)
        }

        // returns "clearance score" along a ray; >0 means clear by that many px (min over obstacles)
        const clearanceScore = (angle: number, probeDist: number) => {
            const dir = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle))
            const to = pos.clone().add(dir.scale(probeDist))
            let minClear = Number.POSITIVE_INFINITY
            let any = false

            for (const o of all) {
                // only consider obstacles roughly in front (avoid weird back detours)
                const toO = new Phaser.Math.Vector2(o.x - this.x, o.y - this.y)
                if (toO.dot(dir) < -8) continue

                const d = segDist(pos, to, new Phaser.Math.Vector2(o.x, o.y))
                const needed = radiusOf(o) + CLEAR_PAD
                const clear = d - needed
                if (clear < minClear) minClear = clear
                any = true
            }

            return any ? minClear : probeDist // if no obstacles, pretend fully clear
        }

        // 1) try straight path first
        const straightClear = clearanceScore(angToTarget, FRONT_PROBE)
        if (straightClear > 0) {
            const vel = fwd.scale(this.speed)
            this.setVelocity(vel.x, vel.y)
            this.updateFacingDirection()
            this.play(`${this.getAnimationTextureName()}-walking-${this.facing}`, true)
            return
        }

        // 2) evaluate left/right detours; choose the side with more clearance
        const leftAng = angToTarget - SIDE_ANGLE
        const rightAng = angToTarget + SIDE_ANGLE
        const leftScore = clearanceScore(leftAng, SIDE_PROBE)
        const rightScore = clearanceScore(rightAng, SIDE_PROBE)

        let steerAng: number
        if (leftScore === rightScore) {
            // tie-breaker: smaller turn from current heading (reduces “long” detours)
            const curVelAng = this.body?.velocity?.angle() ?? angToTarget
            const dl = Math.abs(Phaser.Math.Angle.Wrap(leftAng - curVelAng))
            const dr = Math.abs(Phaser.Math.Angle.Wrap(rightAng - curVelAng))
            steerAng = dl <= dr ? leftAng : rightAng
        } else {
            steerAng = leftScore > rightScore ? leftAng : rightAng
        }

        // 3) build desired velocity toward chosen steer angle
        const steer = new Phaser.Math.Vector2(Math.cos(steerAng), Math.sin(steerAng)).scale(this.speed)

        // 4) add a bit of separation to avoid clumping (local repulsion)
        const sep = new Phaser.Math.Vector2()
        for (const o of all) {
            const to = new Phaser.Math.Vector2(this.x - o.x, this.y - o.y)
            const d = to.length()
            if (d > 1 && d < SEP_RANGE) {
                sep.add(to.scale((SEP_RANGE - d) / SEP_RANGE / d))
            }
        }
        if (sep.lengthSq() > 0) {
            sep.normalize().scale(this.speed * SEP_WEIGHT)
            steer.add(sep)
        }

        this.setVelocity(steer.x, steer.y)
        this.updateFacingDirection()
        this.play(`${this.getAnimationTextureName()}-walking-${this.facing}`, true)
    }

    startCastingAbility() {
        this.mana = 0
        this.manaBar.setValue(this.mana, this.maxMana)

        this.castAbility()
    }

    castAbility(rawMultiplier = 1) {
        // each character and monster will have it's own
    }

    onAnimationFrame(key: string, executeOnFrame: number, callback: Function, onCleanup?: Function, override?: boolean) {
        const anim = this.anims.get(key)

        const onUpdate = (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
            if (animation.key !== key) return

            if (frame.index === executeOnFrame) {
                callback()
            }
        }

        this.on("animationupdate", onUpdate)

        this.play({ key: key, frameRate: anim.frames.length * this.attackSpeed, repeat: 0 }, !override)

        const cleanup = () => {
            this.off("animationupdate", onUpdate)
            onCleanup?.()
        }
        this.once("animationcomplete", cleanup)
        this.once("animationstop", cleanup)
    }

    getAttackingAnimation() {
        const spriteVariant = Phaser.Math.RND.weightedPick([1, 2])
        return `attacking${spriteVariant}`
    }

    getAnimationTextureName() {
        return this.name
    }

    startAttack() {
        if (this.attacking || this.casting || !this.target?.active || this.attackLocked) {
            return
        }

        this.updateFacingDirection()
        this.attacking = true
        const animationKey = `${this.getAnimationTextureName()}-${this.getAttackingAnimation()}-${this.facing}`

        this.onAnimationFrame(
            animationKey,
            this.attackAnimationImpactFrame,
            () => this.landAttack(),
            () => (this.attacking = false)
        )
    }

    landAttack() {
        this.onAttackLand("normal")
    }

    tryCrit() {
        return Phaser.Math.FloatBetween(0, 100) <= this.critChance
    }

    calculateDamage(rawValue: number) {
        const crit = this.tryCrit()
        let multiplier = 0

        if (crit) {
            multiplier += this.critDamageMultiplier
        }

        const value = rawValue * Phaser.Math.FloatBetween(this.minDamageMultiplier, this.maxDamageMultiplier)
        return { value: value * Math.max(1, multiplier), crit }
    }

    onAttackLand(damagetype: DamageType, target?: Creature) {
        const victim = target ?? this.target
        if (!victim?.active) return 0

        const { value: damage, crit: isCrit } = this.calculateDamage(this.attackDamage)

        victim.gainMana(victim.manaOnHit)
        victim.takeDamage(damage, this, damagetype, isCrit)
        this.gainMana(this.manaPerAttack)

        return damage
    }

    gainShield(value: number) {
        this.shield += value
        this.healthBar.setShield(this.shield, this.health, this.maxHealth)
    }

    heal(value: number, crit?: boolean, fx = true) {
        this.health = Math.min(this.maxHealth, this.health + value)
        this.healthBar.setValue(this.health, this.maxHealth)

        if (fx) {
            showDamageText(this.scene, this.x, this.y, Math.round(value), { type: "heal", crit })
            this.onHealFx()
        }
    }

    takeDamage(damage: number, attacker: Creature, type: DamageType, crit = false, emit = true) {
        const incomingDamage = damage
        const resistanceMultiplier = 1 - this.armor / 100
        let finalDamage = type === "true" ? damage : Math.max(0, incomingDamage * resistanceMultiplier)

        if (finalDamage <= 0) {
            type = "block"
        }

        showDamageText(this.scene, this.x, this.y, Math.round(finalDamage), { crit, type })
        if (finalDamage > 0 && (attacker.team === this.scene.playerTeam || attacker.team === this.scene.playerTeam.minions)) {
            this.scene.playerTeam.damageChart.plotDamage(attacker.master || attacker, finalDamage, type)
        }

        let hpDamage = Math.max(0, finalDamage)
        let absorbed = 0

        if (this.shield > 0 && hpDamage > 0) {
            absorbed = Math.min(this.shield, hpDamage)
            this.shield -= absorbed // consume shield
            hpDamage -= absorbed // remainder hits HP
        }

        // HP update
        this.health -= hpDamage
        this.healthBar.setValue(this.health, this.maxHealth)
        this.healthBar.setShield(this.shield, this.health, this.maxHealth)

        this.scene.onHitFx(type, this.x, this.y, this)

        if (attacker?.lifesteal > 0 && finalDamage > 0) {
            attacker.heal(finalDamage * (attacker.lifesteal / 100), crit, false)
        }

        if (this.health <= 0) {
            this.die()
            attacker.emit("kill", this)
            return
        }

        if (emit) {
            attacker.emit("dealt-damage", this, finalDamage)
            this.emit("damage-taken", finalDamage, attacker)
        }
    }

    onNormalHit() {
        burstBlood(this.scene, this.x, this.y)
    }

    revive(heal?: number) {
        this.active = true
        this.updateDepth()
        this.setRotation(0)
        this.resetUi()

        if (heal) this.heal(heal, false, false)
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

        this.statusEffects.clear()
        this.stopMoving()
        this.idle()
        this.anims.stop()
        this.active = false
        this.setDepth(this.depth - 1)
        this.onDieFx()
        this.healthBar.fadeOut()
        this.manaBar.fadeOut()

        this.emit("died")
    }

    onDieFx() {
        const poolSize = Phaser.Math.FloatBetween(0.3, 0.8)

        const bloodPool = new Phaser.GameObjects.Image(this.scene, this.x, this.y + 10, "blood")
        this.scene.perRoundFx.add(bloodPool, true)

        bloodPool
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
    }

    gainMana(manaGained: number) {
        if (this.manaLocked) return

        this.mana = Phaser.Math.Clamp(this.mana + manaGained, 0, this.maxMana)
        this.manaBar?.setValue(this.mana, this.maxMana)

        if (this.mana === this.maxMana && !this.casting) {
            this.startCastingAbility()
        }
    }

    regenMana(delta: number) {
        if (this.casting) return

        const passedSeconds = delta / 1000
        const manaGained = this.manaPerSecond * passedSeconds
        this.gainMana(manaGained)
    }

    getMissingHealthFraction() {
        if (this.maxHealth <= 0) return 1
        // 1 at full HP → 2 at 0 HP
        const missingHealthPercent = this.health / this.maxHealth
        return missingHealthPercent
    }

    getMergeResult(item: Item) {
        if (!ItemRegistry.isComponent(item)) return

        for (const component of this.items) {
            if (ItemRegistry.isComponent(component)) {
                const mergeResult = Item.getMergeResult(this.scene, [item, component])
                if (mergeResult) return { component, result: mergeResult }
            }
        }
    }

    tryMerge(item: Item) {
        const result = this.getMergeResult(item)
        if (result) {
            const completedItem = ItemRegistry.create(result.result.key, this.scene)
            this.unequipItem(result.component)
            result.component.sprite.destroy(true)
            this.scene.availableItems.delete(item)
            this.scene.availableItems.delete(result.component)
            item.sprite.destroy(true)
            completedItem.snapToCreature(this)
            Item.resetTooltip()
            return completedItem
        }

        return item
    }

    hasThiefsGloves() {
        for (const item of this.items) {
            if (Item.isThiefsGloves(item)) {
                return true
            }
        }

        return false
    }

    equipItem(_item: Item, fromThiefsGloves = false) {
        const item = this.tryMerge(_item)

        // thief's gloves conditions
        if (this.hasThiefsGloves() && !fromThiefsGloves) {
            item.drop()
            return
        }
        if (Item.isThiefsGloves(item) && this.items.size > 0) {
            item.drop()
            return
        }

        if (this.items.size === 3) return

        if (item.user) {
            item.user.unequipItem(item)
        }

        this.items.add(item)
        item.user = this
        if (!fromThiefsGloves) {
            this.refreshStats()
        }
        // Debug: log when adding the move listener
        this.on("move", item.syncPosition, item)
    }

    unequipItem(item: Item, silent = false) {
        this.items.delete(item)
        item.user = undefined
        item.cleanup(this)

        if (!silent && !this.isRefreshing) this.refreshStats()

        this.off("move", item.syncPosition, item)
        this.items.forEach((item) => item.syncPosition(this))
    }

    destroyUi() {
        this.healthBar.destroy()
        this.manaBar.destroy()
    }

    updateDepth() {
        const currentRow = this.scene.grid.worldToCell(this.x, this.y)?.row
        if (currentRow && this.active) {
            this.setDepth(currentRow)
        }
    }

    selfUpdate(delta: number) {
        if (this.health <= 0) {
            this.die()
            return
        }

        this.updateDepth()
        this.regenMana(delta)

        for (const effect of this.statusEffects) {
            effect.update(delta)
        }
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
            if (!this.attacking && !this.moveLocked) {
                this.moveToTarget()
                this.avoidOtherCharacters()
                this.emit("move", this)
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

import { Creature, Direction } from "../Creature"
import { ProceduralCreatureFramePainter } from "../visual/ProceduralCreatureVisualDefinition"
import { ItemRegistry } from "../../systems/Items/ItemRegistry"
import { DamageType } from "../../ui/DamageNumbers"
import { Game } from "../../scenes/Game"
import { Monster } from "./Monster"

const slimeSplitHealthThreshold = 0.5
const slimeMinimumDisplaySize = 16
const slimeBaseFrameSize = 64
const slimeGrowthPixelsPerCast = 16
const slimeBloomHealApRatio = 1.5
const slimeSplitSplashDurationMs = 1000

function getDirectionalOffset(direction: Direction): { x: number; y: number } {
    if (direction === "left") return { x: -1, y: 0 }
    if (direction === "right") return { x: 1, y: 0 }
    if (direction === "up") return { x: 0, y: -1 }
    return { x: 0, y: 1 }
}

export const drawSlimeFrame: ProceduralCreatureFramePainter = ({ graphics, action, direction, frame, frameCount }) => {
    const progress = frameCount <= 1 ? 0 : frame / (frameCount - 1)
    const wave = Math.sin(progress * Math.PI * 2)
    const impact = action === "attacking1" ? Math.sin(progress * Math.PI) : action === "attacking2" ? Math.sin(progress * Math.PI * 1.4) : 0
    const melt = action === "casting" ? progress : 0
    const dir = getDirectionalOffset(direction)
    const faceX = direction === "left" ? -4 : direction === "right" ? 4 : 0
    const faceY = direction === "up" ? -2 : direction === "down" ? 1 : 0
    const walkSquash = action === "walking" ? wave * 3 : 0
    const idlePulse = action === "idle" ? wave * 1.5 : 0
    const bodyWidth = 33 + walkSquash + idlePulse + (action === "attacking2" ? impact * 7 : 0)
    const bodyHeight = 25 - walkSquash * 0.45 + idlePulse * 0.3 - melt * 14 + (action === "attacking2" ? impact * 3 : 0)
    const bodyY = 39 + Math.abs(wave) * 1.5 + melt * 11

    graphics.fillStyle(0x000000, 0.22)
    graphics.fillEllipse(32, 56, 32 + melt * 12, 8 + melt * 5)

    if (action === "attacking1") {
        graphics.fillStyle(0x3ab9ff, 0.62)
        graphics.fillEllipse(32 + dir.x * (13 + impact * 11), 38 + dir.y * (8 + impact * 7), 13 + impact * 13, 9 + impact * 6)
        graphics.fillStyle(0xa9ecff, 0.45)
        graphics.fillEllipse(32 + dir.x * (17 + impact * 12), 35 + dir.y * (9 + impact * 7), 6 + impact * 5, 4 + impact * 3)
    }

    graphics.fillStyle(0x1379c7, 0.88)
    graphics.fillEllipse(32, bodyY + 3, bodyWidth + 3, Math.max(8, bodyHeight))
    graphics.fillStyle(0x28a8ff, 0.82)
    graphics.fillEllipse(32, bodyY, bodyWidth, Math.max(7, bodyHeight))
    graphics.fillStyle(0x7ddcff, 0.48)
    graphics.fillEllipse(25 + faceX * 0.4, bodyY - 8, 12 + idlePulse, 6)
    graphics.fillStyle(0xc8f6ff, 0.54)
    graphics.fillEllipse(23 + faceX * 0.5, bodyY - 10, 6, 3)

    if (action === "casting") {
        graphics.fillStyle(0x4dc9ff, 0.62)
        graphics.fillEllipse(32, 53, 30 + melt * 20, 7 + melt * 7)
        graphics.fillStyle(0xa9ecff, 0.38)
        graphics.fillCircle(21 + melt * 4, 50 - melt * 8, 2 + melt * 2)
        graphics.fillCircle(42 - melt * 5, 48 - melt * 6, 1.8 + melt * 2)
    }

    if (direction !== "up" && melt < 0.72) {
        graphics.fillStyle(0x06395f, 0.82)
        graphics.fillCircle(27 + faceX, 36 + faceY + melt * 8, 2.1)
        graphics.fillCircle(37 + faceX, 36 + faceY + melt * 8, 2.1)
        graphics.fillStyle(0xc8f6ff, 0.9)
        graphics.fillCircle(26.4 + faceX, 35.3 + faceY + melt * 8, 0.7)
        graphics.fillCircle(36.4 + faceX, 35.3 + faceY + melt * 8, 0.7)
    }
}

export class Slime extends Monster {
    baseMaxHealth = 180
    baseAttackDamage = 18
    baseAttackSpeed = 1
    baseAbilityPower = 45
    baseMaxMana = 90
    baseManaPerAttack = 12
    baseManaPerSecond = 6
    abilityName = "Ooze Bloom"
    isSplitClone = false

    private isSplitting = false
    private splitSplashTimer?: Phaser.Time.TimerEvent

    constructor(scene: Game) {
        super(scene, "slime")
        this.preferredPosition = "front"
        this.challengeRating = this.calculateCR()
    }

    override takeDamage(damage: number, attacker: Creature, type: DamageType, crit = false, emit = true, source = "Attack") {
        if (this.isSplitting) return 0

        const wasAboveSplitThreshold = this.health > this.maxHealth * slimeSplitHealthThreshold
        const result = super.takeDamage(damage, attacker, type, crit, emit, source)

        if (this.active && wasAboveSplitThreshold && this.health > 0 && this.health <= this.maxHealth * slimeSplitHealthThreshold) {
            this.trySplit()
        }

        return result
    }

    override landAttack(): void {
        if (this.isSplitting) return

        super.landAttack()
    }

    override destroy(fromScene?: boolean): void {
        this.splitSplashTimer?.remove(false)
        this.splitSplashTimer = undefined
        super.destroy(fromScene)
    }

    override reset(): void {
        this.splitSplashTimer?.remove(false)
        this.splitSplashTimer = undefined
        this.isSplitting = false
        this.canBeTargeted = true
        super.reset()
    }

    override castAbility(): boolean {
        this.growAndHeal()
        this.trySplit()
        return true
    }

    private growAndHeal(): void {
        this.baseScale += slimeGrowthPixelsPerCast / slimeBaseFrameSize
        this.setScale(this.baseScale)
        this.items.forEach((item) => item.syncPosition(this))
        this.heal(this.abilityPower * slimeBloomHealApRatio, { healer: this, source: this.abilityName })
    }

    private trySplit(): void {
        if (this.isSplitting || !this.team) return

        const currentDisplaySize = slimeBaseFrameSize * this.baseScale
        if (currentDisplaySize <= slimeMinimumDisplaySize) return

        const splitHealth = Math.max(1, this.health)
        const splitScale = this.baseScale / 2
        const clone = new Slime(this.scene)
        const position = this.randomPointAround()
        clone.isSplitClone = true
        this.team.add(clone)
        clone.reset()

        this.copyItemsTo(clone)
        this.applySplitStats(splitHealth, splitScale)
        clone.applySplitStats(splitHealth, splitScale)
        clone.applyAuras()
        clone.applyAugments()
        clone.teleportTo(position.x, position.y)
        clone.boardX = this.boardX
        clone.boardY = this.boardY
        clone.target = this.target?.active ? this.target : undefined
        clone.idle()

        this.enterSplitSplashState()
        clone.enterSplitSplashState()
    }

    private applySplitStats(splitHealth: number, splitScale: number): void {
        this.baseScale = splitScale
        this.baseMaxHealth = splitHealth
        this.maxHealth = splitHealth
        this.health = splitHealth
        this.setActive(true)
        this.setVisible(true)
        this.attackLocked = false
        this.moveLocked = false
        this.manaLocked = false
        this.frozen = false
        this.body.enable = true
        this.body.stop()
        this.setScale(splitScale)
        this.updateHealthUi()
        this.items.forEach((item) => item.syncPosition(this))
    }

    private enterSplitSplashState(): void {
        this.splitSplashTimer?.remove(false)
        this.isSplitting = true
        this.attackLocked = true
        this.moveLocked = true
        this.manaLocked = true
        this.attacking = false
        this.casting = false
        this.stopMoving()
        this.body.stop()
        this.removeFromEnemyTarget(slimeSplitSplashDurationMs)
        this.playSplitSplashFx()

        this.splitSplashTimer = this.scene.time.delayedCall(slimeSplitSplashDurationMs, () => {
            this.splitSplashTimer = undefined
            if (!this.active) return

            this.isSplitting = false
            this.attackLocked = false
            this.moveLocked = false
            this.manaLocked = false
            this.canBeTargeted = true
            this.idle()
        })
    }

    private copyItemsTo(clone: Slime): void {
        for (const item of this.items) {
            const itemCopy = ItemRegistry.create(item.key, this.scene)
            clone.equipItem(itemCopy, true)
        }
    }

    private playSplitSplashFx(): void {
        const splash = this.scene.add.graphics({ x: this.x, y: this.y + 9 }).setDepth(this.depth + 2).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(splash)

        splash.fillStyle(0x4dc9ff, 0.48)
        splash.fillEllipse(0, 0, 64 * this.scale, 24 * this.scale)
        splash.lineStyle(4, 0xa9ecff, 0.9)
        splash.strokeEllipse(0, 0, 72 * this.scale, 28 * this.scale)
        splash.lineStyle(2, 0xffffff, 0.7)
        splash.strokeEllipse(0, 0, 42 * this.scale, 15 * this.scale)
        splash.fillStyle(0xa9ecff, 0.8)

        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12
            splash.fillCircle(Math.cos(angle) * 22 * this.scale, Math.sin(angle) * 10 * this.scale, 3 * this.scale)
        }

        this.scene.tweens.add({
            targets: splash,
            alpha: 0,
            scale: 2,
            duration: slimeSplitSplashDurationMs,
            ease: "Sine.easeOut",
            onComplete: () => splash.destroy(true),
        })
    }
}

import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { Creature } from "../Creature"
import {
    ANTONIO_ANT_DURATION_MS,
    ANTONIO_ANT_TICK_AD_RATIO,
    ANTONIO_ANT_TICK_AP_RATIO,
    ANTONIO_ANT_TICK_RATE_MS,
    ANTONIO_EXTRA_EGG_ON_CAST,
    calculateAntonioAntTickDamage,
    calculateAntonioEggsPerHit,
    calculateAntonioHealPerEgg,
    countAntonioAnts,
} from "./AntonioAnts"

interface EggState {
    eggs: number
    removeListeners: () => void
}

const antSpeed = 260
const antTurnLerp = 0.2
const maxVisibleEggs = 8

class AntonioAntling {
    private readonly graphic: Phaser.GameObjects.Graphics
    private x: number
    private y: number
    private angle: number
    private elapsed = 0
    private tickElapsed = 0
    private cleaned = false

    constructor(
        private readonly scene: Game,
        private readonly owner: Antonio,
        private readonly target: Creature,
        x: number,
        y: number
    ) {
        this.x = x
        this.y = y
        this.angle = Phaser.Math.Angle.Between(x, y, target.x, target.y)
        this.graphic = scene.add.graphics().setDepth(owner.depth + 10).setBlendMode(Phaser.BlendModes.ADD)
        this.scene.perRoundFx.add(this.graphic)
        this.draw()
    }

    get isCleaned(): boolean {
        return this.cleaned
    }

    update(delta: number): void {
        if (this.cleaned) return

        if (!this.graphic.active || !this.owner.active || !this.target.active || this.scene.state !== "fighting") {
            this.cleanup()
            return
        }

        this.elapsed += delta
        if (this.elapsed >= ANTONIO_ANT_DURATION_MS) {
            this.cleanup()
            return
        }

        const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)
        this.angle = Phaser.Math.Angle.RotateTo(this.angle, targetAngle, antTurnLerp)

        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y)
        const step = Math.min((antSpeed * delta) / 1000, distance)
        this.x += Math.cos(this.angle) * step
        this.y += Math.sin(this.angle) * step

        this.tickElapsed += delta
        if (this.tickElapsed >= ANTONIO_ANT_TICK_RATE_MS) {
            this.tickElapsed %= ANTONIO_ANT_TICK_RATE_MS
            this.tick()
        }

        this.draw()
    }

    cleanup(): void {
        if (this.cleaned) return
        this.cleaned = true

        this.scene.perRoundFx.remove(this.graphic, false, false)
        if (this.graphic.scene) this.graphic.destroy(true)
    }

    private tick(): void {
        if (!this.target.active || !this.owner.active || this.scene.state !== "fighting") return

        const { value, crit } = this.owner.calculateDamage(calculateAntonioAntTickDamage(this.owner.attackDamage, this.owner.abilityPower))
        this.target.takeDamage(value, this.owner, "poison", crit, true, this.owner.abilityName)
    }

    private draw(): void {
        const graphic = this.graphic
        graphic.clear()

        const forwardX = Math.cos(this.angle)
        const forwardY = Math.sin(this.angle)
        const sideX = -forwardY
        const sideY = forwardX
        const headX = this.x + forwardX * 4
        const headY = this.y + forwardY * 4

        graphic.lineStyle(1, 0x3f5a3f, 0.85)
        for (let index = -1; index <= 1; index++) {
            const legX = this.x + sideX * index * 2
            const legY = this.y + sideY * index * 2
            graphic.lineBetween(legX, legY, legX + sideX * (index * 2 + 3) - forwardX * 2, legY + sideY * (index * 2 + 3) - forwardY * 2)
        }

        graphic.fillStyle(0x0b120b, 0.95)
        graphic.fillCircle(this.x - forwardX * 3, this.y - forwardY * 3, 3.2)
        graphic.fillCircle(headX, headY, 2.4)

        graphic.fillStyle(0x5cff2e, 0.55)
        graphic.fillCircle(this.x - forwardX * 3, this.y - forwardY * 3, 1.5)
        graphic.fillStyle(0xb6ff5a, 0.95)
        graphic.fillCircle(headX, headY, 1.1)
    }
}

export class Antonio extends Character {
    baseAttackSpeed = 1
    baseAttackDamage = 22
    baseAttackRange = 1
    baseMaxHealth = 500
    baseArmor = 10
    baseSpeed = 115
    baseMaxMana = 50
    baseManaPerSecond = 8
    baseManaPerAttack = 10
    baseCritChance = 10
    baseAbilityPower = 50

    abilityName = "Enxame Devorador"

    private readonly eggs = new Map<Creature, EggState>()
    private eggGraphic?: Phaser.GameObjects.Graphics
    private readonly antlings: AntonioAntling[] = []

    constructor(scene: Game, id: string) {
        super(scene, "antonio", id)
        this.createEggFx()
    }

    override getAbilityDescription(): string {
        const antTickDamage = Math.round(calculateAntonioAntTickDamage(this.attackDamage, this.abilityPower))
        const healPerEgg = Math.round(calculateAntonioHealPerEgg(this.maxHealth, 1))

        return `Passiva: cada ataque básico injeta [primary.main:ovos de formiga] no alvo atingido. Acertos críticos injetam mais ovos, de acordo com o multiplicador de crítico.

Ativa: morde o alvo, injetando um ovo extra antes de chocar a ninhada. Consome todos os ovos, cura [success.main:${healPerEgg} por ovo (vida máxima)] e invoca uma formiguinha por ovo consumido. As formiguinhas duram alguns segundos, perseguem o alvo e causam [info.main:${antTickDamage} de veneno por tick] ([error.main:${Math.round(
            ANTONIO_ANT_TICK_AD_RATIO * 100
        )}% AD] + [info.main:${Math.round(ANTONIO_ANT_TICK_AP_RATIO * 100)}% AP]).`
    }

    override landAttack(): void {
        const target = this.target
        if (!target?.active || !this.active) return

        const { value, crit } = this.calculateDamage(this.attackDamage)
        target.takeDamage(value, this, "normal", crit, true, "Attack")
        this.onHit(target)

        this.addEggs(target, calculateAntonioEggsPerHit(crit, this.critDamageMultiplier))
    }

    override castAbility(multiplier = 1): boolean | void {
        const target = this.target
        if (!target?.active || !target.canBeTargeted || !this.active) return false

        this.casting = true
        this.playCastingAnimation()

        this.addEggs(target, ANTONIO_EXTRA_EGG_ON_CAST)
        const eggs = this.consumeEggs(target)

        this.heal(calculateAntonioHealPerEgg(this.maxHealth, eggs, multiplier), { healer: this, source: this.abilityName })
        this.spawnAnts(target, countAntonioAnts(eggs))

        this.casting = false
    }

    override refreshStats(): void {
        super.refreshStats()
        this.clearAnts()
        this.clearEggs()
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.scene.state === "idle" || !this.active) {
            this.clearAnts()
            this.clearEggs()
        }

        this.updateAnts(delta)
        this.drawEggs(time)
    }

    override destroy(fromScene?: boolean): void {
        this.clearAnts()
        this.clearEggs()
        this.eggGraphic?.destroy(true)
        this.eggGraphic = undefined

        super.destroy(fromScene)
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 14, repeat: 0 }, true)
    }

    private spawnAnts(target: Creature, count: number): void {
        for (let index = 0; index < count; index++) {
            const x = this.x + Phaser.Math.FloatBetween(-10, 10)
            const y = this.y + Phaser.Math.FloatBetween(-6, 6)
            this.antlings.push(new AntonioAntling(this.scene, this, target, x, y))
        }
    }

    private updateAnts(delta: number): void {
        if (this.antlings.length === 0) return

        for (const ant of this.antlings) {
            ant.update(delta)
        }

        for (let index = this.antlings.length - 1; index >= 0; index--) {
            if (this.antlings[index].isCleaned) {
                this.antlings.splice(index, 1)
            }
        }
    }

    private clearAnts(): void {
        for (const ant of this.antlings) {
            ant.cleanup()
        }
        this.antlings.length = 0
    }

    private addEggs(target: Creature, count: number): void {
        if (count <= 0 || !target.active) return

        const existing = this.eggs.get(target)
        if (existing) {
            existing.eggs += count
            return
        }

        const removeState = () => this.removeEggState(target)
        const state: EggState = {
            eggs: count,
            removeListeners: () => {
                target.off("died", removeState)
                target.off("destroy", removeState)
            },
        }

        target.once("died", removeState)
        target.once("destroy", removeState)
        this.eggs.set(target, state)
    }

    private removeEggState(target: Creature): void {
        const state = this.eggs.get(target)
        if (!state) return

        state.removeListeners()
        this.eggs.delete(target)
    }

    private consumeEggs(target: Creature): number {
        const state = this.eggs.get(target)
        if (!state) return 0

        const count = state.eggs
        state.removeListeners()
        this.eggs.delete(target)
        return count
    }

    private clearEggs(): void {
        for (const state of this.eggs.values()) {
            state.removeListeners()
        }
        this.eggs.clear()
        this.eggGraphic?.clear()
    }

    private createEggFx(): void {
        this.eggGraphic = this.scene.add.graphics().setDepth(this.depth + 8).setBlendMode(Phaser.BlendModes.ADD)
    }

    private drawEggs(time: number): void {
        const graphic = this.eggGraphic
        if (!graphic?.active) return

        graphic.clear()
        if (this.eggs.size === 0) return

        graphic.setDepth(this.depth + 8)
        const seconds = time / 1000

        for (const [target, state] of this.eggs) {
            if (!target.active) continue

            const visible = Math.min(state.eggs, maxVisibleEggs)
            for (let index = 0; index < visible; index++) {
                const baseAngle = index * 2.399963
                const radius = 4 + (index % 3) * 3
                const sway = Math.sin(seconds * 4 + index) * 1.2
                const eggX = target.x + Math.cos(baseAngle) * radius + sway
                const eggY = target.y - 18 + Math.sin(baseAngle) * radius * 0.7
                const pulse = (Math.sin(seconds * 6 + index) + 1) * 0.5

                graphic.fillStyle(0x1c7a1c, 0.35)
                graphic.fillCircle(eggX, eggY, 3.4 + pulse * 0.6)
                graphic.fillStyle(0x8dff4a, 0.95)
                graphic.fillEllipse(eggX, eggY, 4.2, 5.4)
                graphic.fillStyle(0xd9ff70, 0.8)
                graphic.fillEllipse(eggX - 0.8, eggY - 1.2, 1.4, 1.8)
            }
        }
    }
}

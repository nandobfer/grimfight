import { Character } from "../../creature/character/Character"
import { calculateFeralStatBonus, isFeralThreatened } from "./formulas/FeralTraitFormulas"
import { Trait } from "./Trait"

type TraitBoosts = "attackDamageMultiplier" | "attackSpeedMultiplier" | "healthMultiplier"

type FeralStage = Record<TraitBoosts, number> & {
    descriptionParams: string[]
}

type FeralThreatenedEffect = {
    graphic: Phaser.GameObjects.Graphics
    update: () => void
    originalScaleX: number
    originalScaleY: number
    startedAt: number
}

const FERAL_THREATENED_SCALE_MULTIPLIER = 1.08

export class FeralTrait extends Trait {
    name = "Feral"
    description = "Ferals gain {0} attack damage, {1} attack speed, and {2} maximum health. Below 30% health, these bonuses are doubled."
    stages: Map<number, FeralStage> = new Map([
        [2, { attackDamageMultiplier: 0.1, attackSpeedMultiplier: 0.15, healthMultiplier: 0.1, descriptionParams: ["10%", "15%", "10%"] }],
        [4, { attackDamageMultiplier: 0.2, attackSpeedMultiplier: 0.25, healthMultiplier: 0.15, descriptionParams: ["20%", "25%", "15%"] }],
    ])

    private threatenedCharacters = new WeakSet<Character>()
    private threatenedEffects = new WeakMap<Character, FeralThreatenedEffect>()

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        this.cleanup(character)
        this.applyBonus(character, values, false)

        const updateThreatenedBonus = () => this.updateThreatenedBonus(character, values)

        character.eventHandlers.feralTraitDamageTaken = updateThreatenedBonus
        character.eventHandlers.feralTraitHealed = updateThreatenedBonus
        character.eventHandlers.feralTraitDied = updateThreatenedBonus
        character.on("damage-taken", updateThreatenedBonus)
        character.on("healed", updateThreatenedBonus)
        character.on("died", updateThreatenedBonus)
        character.once("destroy", () => this.cleanup(character))

        this.updateThreatenedBonus(character, values)
    }

    override cleanup(character: Character): void {
        const damageTakenHandler = character.eventHandlers.feralTraitDamageTaken
        if (damageTakenHandler) {
            character.off("damage-taken", damageTakenHandler)
            delete character.eventHandlers.feralTraitDamageTaken
        }

        const healedHandler = character.eventHandlers.feralTraitHealed
        if (healedHandler) {
            character.off("healed", healedHandler)
            delete character.eventHandlers.feralTraitHealed
        }

        const diedHandler = character.eventHandlers.feralTraitDied
        if (diedHandler) {
            character.off("died", diedHandler)
            delete character.eventHandlers.feralTraitDied
        }

        const values = this.stages.get(this.activeStage)
        if (values && this.threatenedCharacters.has(character)) {
            this.removeThreatenedBonus(character, values)
        }

        this.threatenedCharacters.delete(character)
    }

    private updateThreatenedBonus(character: Character, values: FeralStage): void {
        const threatened = character.active && isFeralThreatened(character.health, character.maxHealth)
        const applied = this.threatenedCharacters.has(character)

        if (threatened && !applied) {
            this.applyBonus(character, values, false)
            this.startThreatenedEffect(character)
            this.threatenedCharacters.add(character)
            return
        }

        if (!threatened && applied) {
            this.removeThreatenedBonus(character, values)
            this.stopThreatenedEffect(character)
            this.threatenedCharacters.delete(character)
        }
    }

    private applyBonus(character: Character, values: FeralStage, threatened: boolean): void {
        character.attackDamage += calculateFeralStatBonus(character.baseAttackDamage, values.attackDamageMultiplier, threatened)
        character.attackSpeed += calculateFeralStatBonus(character.baseAttackSpeed, values.attackSpeedMultiplier, threatened)

        const healthBonus = calculateFeralStatBonus(character.baseMaxHealth, values.healthMultiplier, threatened)
        character.maxHealth += healthBonus
        character.health += healthBonus
    }

    private removeThreatenedBonus(character: Character, values: FeralStage): void {
        character.attackDamage -= character.baseAttackDamage * values.attackDamageMultiplier
        character.attackSpeed -= character.baseAttackSpeed * values.attackSpeedMultiplier

        const healthBonus = character.baseMaxHealth * values.healthMultiplier
        character.maxHealth -= healthBonus
        character.health = Math.min(character.health, character.maxHealth)
        this.stopThreatenedEffect(character)
    }

    private startThreatenedEffect(character: Character): void {
        if (this.threatenedEffects.has(character)) return

        const graphic = character.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD)
        character.scene.perRoundFx.add(graphic)

        const effect: FeralThreatenedEffect = {
            graphic,
            update: () => this.drawThreatenedEffect(character),
            originalScaleX: character.scaleX,
            originalScaleY: character.scaleY,
            startedAt: character.scene.time.now,
        }

        this.threatenedEffects.set(character, effect)
        character.setScale(effect.originalScaleX * FERAL_THREATENED_SCALE_MULTIPLIER, effect.originalScaleY * FERAL_THREATENED_SCALE_MULTIPLIER)
        character.scene.events.on("update", effect.update)
        this.drawThreatenedEffect(character)
    }

    private stopThreatenedEffect(character: Character): void {
        const effect = this.threatenedEffects.get(character)
        if (!effect) return

        character.scene.events.off("update", effect.update)
        character.setScale(effect.originalScaleX, effect.originalScaleY)

        if (effect.graphic.active) {
            effect.graphic.destroy(true)
        }

        this.threatenedEffects.delete(character)
    }

    private drawThreatenedEffect(character: Character): void {
        const effect = this.threatenedEffects.get(character)
        if (!effect?.graphic.active || !character.active) return

        const elapsed = (character.scene.time.now - effect.startedAt) / 1000
        const pulse = Math.sin(elapsed * 12) * 0.5 + 0.5
        const scale = Math.max(0.75, Math.abs(character.scaleX || character.scale || 1))
        const x = character.x
        const y = character.y - 18 * scale

        effect.graphic.clear()
        effect.graphic.setDepth(character.depth + 3)

        effect.graphic.lineStyle(6 * scale, 0xff2a00, 0.2 + pulse * 0.1)
        effect.graphic.strokeEllipse(x, y, 44 * scale + pulse * 8, 72 * scale + pulse * 10)
        effect.graphic.lineStyle(2 * scale, 0xffd166, 0.45 + pulse * 0.2)
        effect.graphic.strokeEllipse(x, y + 2 * scale, 30 * scale + pulse * 5, 54 * scale + pulse * 7)

        for (let index = 0; index < 8; index++) {
            const angle = elapsed * 3 + (index / 8) * Math.PI * 2
            const radiusX = (22 + pulse * 5) * scale
            const radiusY = (34 + pulse * 7) * scale
            const sparkX = x + Math.cos(angle) * radiusX
            const sparkY = y + Math.sin(angle) * radiusY
            const alpha = 0.35 + pulse * 0.35

            effect.graphic.fillStyle(index % 2 === 0 ? 0xff7a00 : 0xfff0a3, alpha)
            effect.graphic.fillCircle(sparkX, sparkY, (1.5 + (index % 3) * 0.35) * scale)
        }
    }
}

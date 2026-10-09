import { EdnoSpectralShield } from "../../fx/EdnoSpectralShield"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { EDNO_DIE_FACES, EDNO_SHIELD_HP_RATIO, ednoShieldGrant } from "./EdnoAegis"

/**
 * Edno, the shield-bearer. A Colossi tank whose ability rolls a fate die and
 * conjures a spectral aegis in front of him, blocking enemy projectiles while
 * shielding him and sealing his mana. Mirrors the base stats of Maximus.
 */
export class Edno extends Character {
    baseMaxHealth = 425
    baseArmor = 10
    baseAttackDamage = 15
    baseMaxMana = 120

    abilityName = "Spectral Aegis"

    private aegis?: EdnoSpectralShield
    private aegisShield = 0

    constructor(scene: Game, id: string) {
        super(scene, "edno", id)
    }

    override getAbilityDescription(): string {
        const minShield = Math.round(ednoShieldGrant(this.maxHealth, 1))
        const maxShield = Math.round(ednoShieldGrant(this.maxHealth, EDNO_DIE_FACES))
        const ratio = Math.round(EDNO_SHIELD_HP_RATIO * 100)

        return `Rolls a [primary.main:d4] of fate and raises a [primary.main:${this.abilityName}]. Each pip conjures a wide spectral shield in front of him that intercepts enemy projectiles, stacked one before the other, and grants him a shield for [success.main:${minShield}] health at the lowest face up to [success.main:${maxShield}] at the highest, built from [success.main:${ratio}% max health] per pip. The shield fades with the aegis. While it holds, his mana stays sealed.`
    }

    override castAbility(): boolean | void {
        if (!this.active || this.casting) return false

        this.casting = true
        this.playCastingAnimation()

        this.dropAegis()

        const roll = this.rollDestiny(EDNO_DIE_FACES)
        const before = this.shield
        this.gainShield(ednoShieldGrant(this.maxHealth, roll))
        this.aegisShield = this.shield - before
        this.manaLocked = true

        this.aegis = new EdnoSpectralShield(this, roll, () => this.onAegisEnded())

        this.casting = false
    }

    private onAegisEnded(): void {
        this.aegis = undefined
        this.loseShield(this.aegisShield)
        this.aegisShield = 0
        if (this.active) this.manaLocked = false
    }

    private dropAegis(): void {
        this.aegis?.cleanup()
        this.aegis = undefined
    }

    private playCastingAnimation(): void {
        const key = `${this.getAnimationTextureName()}-casting-${this.facing}`
        this.play({ key, frameRate: 14, repeat: 0 }, true)
    }
}

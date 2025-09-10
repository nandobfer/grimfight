import { FxSprite } from "../../fx/FxSprite"
import { ThornsFx } from "../../fx/ThornsFx"
import { Arrow } from "../../objects/Arrow"
import { Dot } from "../../objects/Dot"
import { Game } from "../../scenes/Game"
import { DamageType } from "../../ui/DamageNumbers"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

const humanMultiplier = 3

type DruidForm = "human" | "bear" | "cat"
export class Helyna extends Character {
    baseAttackSpeed = 1
    baseSpeed = 60
    baseAttackDamage = 20
    baseMaxMana = 120
    baseAbilityPower = 20
    baseAttackRange = 3
    baseMaxHealth: number = 400

    abilityName = "Druidismo"

    bonusMaxHealth = 0
    bonusScale = 0
    bonusAD = 0
    bonusSpeed = 0
    bonusAttackSpeed = 0
    bonusCriticalChance = 0
    bonusAttackRange = 0
    thornsArmor = false

    druidForm: DruidForm = "human"
    thornsFx?: ThornsFx

    constructor(scene: Game, id: string) {
        super(scene, "helyna", id)
        // this.createAnimations()
    }

    override getAbilityDescription(): string {
        const placement = this.getPlacement()

        const bear = `[primary.main:Urso] (frente): Ganha [default:(50%)] de tamanho, [primary.main.main: 10%] armadura, [success.main: ${Math.round(
            this.abilityPower * 10
        )}] [info.main:(1000% AP)] de vida máxima e [error.main: ${Math.round(this.abilityPower * 0.25)}] [info.main: (25% AP)] de ataque. 
Ao lançar, conjura uma armadura de espinhos, aumentando sua armadura em [primary.main:10%] e causando [info.main:${Math.round(
            this.abilityPower * 0.3
        )} (30% AP)] de dano a atacantes.`

        const cat = `[primary.main:Gato] (meio): Ganha velocidade, [error.main:${Math.round(
            this.abilityPower
        )}] [info.main:(100% AP)] de ataque, [warning.main:25%] de velocidade de ataque e [error.main:${Math.round(
            this.abilityPower / 100
        )}] [info.main:(1% AP)] chance de crítico. 
Ao lançar, aplica um sangramento no alvo, causando [error.main:${Math.round(this.attackDamage * 3)} (300% AD)] de dano.`

        const human = `[primary.main:Humano] (atrás): Não se transforma em nada, mas sua habilidade cura o aliado com menos vida no campo em [info.main:${Math.round(
            this.abilityPower * humanMultiplier
        )} (200% AP)].`

        return placement === "front"
            ? bear
            : placement === "middle"
            ? cat
            : placement === "back"
            ? human
            : `Se transforma em um animal, baseado na posição inicial, concedendo atributos e habilidades específicas para cada um.

${bear}

${cat}
        
${human}`
    }

    override landAttack() {
        this.fire()
    }

    fire() {
        if (!this.target) return

        const arrow = new Arrow(this)
        arrow.setTint(0x00ff00)
        arrow.fire(this.target)
    }

    override castAbility(multiplier?: number): void {
        this.casting = true

        switch (this.druidForm) {
            case "bear":
                this.castBearAbility(multiplier)
                break
            case "cat":
                this.castCatAbility(multiplier)
                break
            case "human":
                const placement = this.getPlacement()
                if (placement === "back") {
                    // human normal cast
                    this.castHumanAbility(multiplier)
                } else {
                    this.shapeshift(placement === "front" ? "bear" : "cat")
                }
                break
        }
        this.casting = false
    }

    private shapeshift(form: DruidForm) {
        this.druidForm = form
        switch (form) {
            case "bear":
                this.makeBear()
                break
            case "cat":
                this.makeCat()
                break
        }
        const fx = new FxSprite(this.scene, this.x, this.y, "fog", this.scale / 2)
        this.landAttack = super.landAttack
    }

    castHumanAbility(multiplier = 1) {
        const target = this.team.getLowestHealth()
        if (target) {
            const { value, crit } = this.calculateDamage(this.abilityPower * humanMultiplier * multiplier)
            target.heal(value, crit)
        }
    }

    castCatAbility(multiplier = 1) {
        if (!this.target) return

        // todo animation

        const bleeding = new Dot({
            damageType: "poison",
            duration: 2000,
            target: this.target,
            tickDamage: this.attackDamage * 3 * multiplier,
            tickRate: 900,
            user: this,
        })
        this.target.applyStatusEffect(bleeding)
    }

    castBearAbility(multiplier = 1) {
        const duration = 5000
        this.manaLocked = true
        this.thornsArmor = true

        if (!this.thornsFx) {
            this.thornsFx = new ThornsFx(this.scene, this.x, this.y, this.scale * 0.45, this)
        }

        const bonusResistance = 10 * multiplier

        this.armor += bonusResistance

        this.scene.time.delayedCall(duration, () => {
            this.manaLocked = false
            this.thornsArmor = false
            this.thornsFx?.destroy(true)
            this.thornsFx = undefined
            this.armor -= bonusResistance
        })
    }

    makeBear() {
        this.setTexture("druid_bear")
        this.attackRange = 1
        const healthRate = this.health / this.maxHealth
        this.maxHealth = this.bonusMaxHealth + this.abilityPower * 10
        this.health = this.maxHealth * healthRate
        this.setScale(this.bonusScale * 1.5)
        this.attackDamage = this.bonusAD + this.abilityPower * 0.25
        this.armor += 10
        this.manaOnHit += 3
    }

    makeCat() {
        this.setTexture("druid_cat")
        this.attackRange = 1
        this.attackDamage = this.bonusAD + this.abilityPower
        this.attackSpeed = this.bonusAttackSpeed * 1.25
        this.speed = this.bonusSpeed * 2
        this.critChance = this.bonusCriticalChance + this.abilityPower / 100
    }

    dealThornsDamage(target: Creature) {
        const { value, crit } = this.calculateDamage(this.abilityPower * 0.3)
        target.takeDamage(value, this, "poison", crit)
    }

    override extractAnimationsFromSpritesheet(
        key: string,
        startingFrame: number,
        usedFramesPerRow: number,
        totalFramesPerRow?: number,
        texture?: string
    ): Phaser.Animations.Animation[] {
        super.extractAnimationsFromSpritesheet(key, startingFrame, usedFramesPerRow, totalFramesPerRow, "druid_bear", "druid_bear")
        super.extractAnimationsFromSpritesheet(key, startingFrame, usedFramesPerRow, totalFramesPerRow, "druid_cat", "druid_cat")
        return super.extractAnimationsFromSpritesheet(key, startingFrame, usedFramesPerRow, totalFramesPerRow, texture)
    }

    override getAnimationTextureName(): string {
        const key = this.druidForm === "human" ? this.name : `druid_${this.druidForm}`
        return key
    }

    override refreshStats(): void {
        super.refreshStats()
        this.setTexture(this.name)
        this.druidForm = "human"
        this.landAttack = this.fire
        this.bonusSpeed = this.speed
        this.bonusMaxHealth = this.maxHealth
        this.bonusAD = this.attackDamage
        this.bonusAttackSpeed = this.attackSpeed
        this.bonusCriticalChance = this.critChance
        this.bonusScale = this.scale
        this.bonusAttackRange = this.attackRange
        this.thornsArmor = false

        this.mana = this.maxMana * 0.35
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)

        if (this.thornsFx) {
            this.thornsFx.x = this.x
            this.thornsFx.y = this.y
        }
    }

    override takeDamage(damage: number, attacker: Creature, type: DamageType, crit?: boolean): void {
        super.takeDamage(damage, attacker, type, crit)

        if (this.thornsArmor && attacker) {
            this.dealThornsDamage(attacker)
        }
    }
}

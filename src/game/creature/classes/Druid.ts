import { FxSprite } from "../../fx/FxSprite"
import { ThornsFx } from "../../fx/ThornsFx"
import { Arrow } from "../../objects/Projectile/Arrow"
import { Dot } from "../../objects/StatusEffect/Dot"
import { Game } from "../../scenes/Game"
import { DamageType } from "../../ui/DamageNumbers"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

const humanMultiplier = 1

type DruidForm = "human" | "bear" | "cat"
export class Helyna extends Character {
    baseAttackSpeed = 1
    baseAttackDamage = 20
    baseMaxMana = 120
    baseAttackRange = 3
    baseMaxHealth: number = 400

    abilityName = "Druidism"

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
        try {
            const placement = this.getPlacement()

            const bear = `[primary.main:Bear] (front): Gains [default:(50%)] size, [primary.main.main: 10%] armor, [success.main: ${Math.round(
                this.abilityPower * 3
            )}] [info.main:(300% AP)] maximum health and [error.main: ${Math.round(
                this.abilityPower * 0.1
            )}] [info.main: (10% AP)] attack. When cast [warning.main:(Thorn Armor)], conjures a thorn armor, increasing armor by [primary.main:10%] and dealing [info.main:${Math.round(
                this.abilityPower * 0.1
            )} (10% AP)] damage to attackers.`

            const cat = `[primary.main:Cat] (middle): Gains speed, [error.main:${Math.round(
                this.abilityPower * 0.3
            )}] [info.main:(30% AP)] attack, [warning.main:25%] attack speed and [error.main:${Math.round(
                this.abilityPower * 0.01
            )}] [info.main:(1% AP)] critical chance. When cast [error.main:(Rake)], applies a bleed on the target, dealing [error.main:${Math.round(
                this.attackDamage * 1.5
            )} (150% AD)] damage.`

            const human = `[primary.main:Human] (back): Doesn't transform into anything, but your ability [success.main:(Regrowth)] heals the ally with the least health on the field for [info.main:${Math.round(
                this.abilityPower * humanMultiplier
            )} (100% AP)].`

            return placement === "front"
                ? bear
                : placement === "middle"
                ? cat
                : placement === "back"
                ? human
                : `Shapeshift into an animal, based on the starting position, granting specific attributes and abilities for each one.

${bear}

${cat}
        
${human}`
        } catch (error) {
            return ""
        }
    }
    //     override getAbilityDescription(): string {
    //         try {
    //             const placement = this.getPlacement()

    //             const bear = `[primary.main:Urso] (frente): Ganha [default:(50%)] de tamanho, [primary.main.main: 10%] armadura, [success.main: ${Math.round(
    //                 this.abilityPower * 3
    //             )}] [info.main:(300% AP)] de vida máxima e [error.main: ${Math.round(this.abilityPower * 0.1)}] [info.main: (10% AP)] de ataque.
    // Ao lançar, conjura uma armadura de espinhos, aumentando sua armadura em [primary.main:10%] e causando [info.main:${Math.round(
    //                 this.abilityPower * 0.1
    //             )} (10% AP)] de dano a atacantes.`

    //             const cat = `[primary.main:Gato] (meio): Ganha velocidade, [error.main:${Math.round(
    //                 this.abilityPower * 0.3
    //             )}] [info.main:(30% AP)] de ataque, [warning.main:25%] de velocidade de ataque e [error.main:${Math.round(
    //                 this.abilityPower * 0.01
    //             )}] [info.main:(1% AP)] chance de crítico.
    // Ao lançar, aplica um sangramento no alvo, causando [error.main:${Math.round(this.attackDamage * 1.5)} (150% AD)] de dano.`

    //             const human = `[primary.main:Humano] (atrás): Não se transforma em nada, mas sua habilidade cura o aliado com menos vida no campo em [info.main:${Math.round(
    //                 this.abilityPower * humanMultiplier
    //             )} (100% AP)].`

    //             return placement === "front"
    //                 ? bear
    //                 : placement === "middle"
    //                 ? cat
    //                 : placement === "back"
    //                 ? human
    //                 : `Se transforma em um animal, baseado na posição inicial, concedendo atributos e habilidades específicas para cada um.

    // ${bear}

    // ${cat}

    // ${human}`
    //         } catch (error) {
    //             return ""
    //         }
    //     }

    override landAttack() {
        this.fire()
    }

    fire() {
        if (!this.target || !this?.active) return

        const arrow = new Arrow(this.scene, this.x, this.y, this)
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
            target.heal(value, crit, true, { healer: this, source: "Regrowth" })
        }
    }

    castCatAbility(multiplier = 1) {
        if (!this.target) return

        // todo animation

        const bleeding = new Dot({
            damageType: "poison",
            duration: 2000,
            target: this.target,
            tickDamage: this.attackDamage * 1.5 * multiplier,
            tickRate: 900,
            user: this,
            abilityName: 'Rake'
        })
        bleeding.start()
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
        this.maxHealth = this.bonusMaxHealth + this.abilityPower * 3
        this.health = this.maxHealth * healthRate
        this.setScale(this.bonusScale * 1.5)
        this.attackDamage = this.bonusAD + this.abilityPower * 0.1
        this.armor += 10
        this.manaOnHit += 3
    }

    makeCat() {
        this.setTexture("druid_cat")
        this.attackRange = 1
        this.attackDamage = this.bonusAD + this.abilityPower * 0.3
        this.attackSpeed = this.bonusAttackSpeed * 1.25
        this.speed = this.bonusSpeed * 2
        this.critChance = this.bonusCriticalChance + this.abilityPower * 0.01
    }

    dealThornsDamage(target: Creature) {
        const { value, crit } = this.calculateDamage(this.abilityPower * 0.1)
        target.takeDamage(value, this, "poison", crit, false, this.abilityName)
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

    override takeDamage(damage: number, attacker: Creature, type: DamageType, crit?: boolean, emit = true, source = "Attack") {
        const damageTaken = super.takeDamage(damage, attacker, type, crit, emit, source)

        if (this.thornsArmor && attacker) {
            this.dealThornsDamage(attacker)
        }

        return damageTaken
    }
}

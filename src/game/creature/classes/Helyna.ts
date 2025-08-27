import { Dot } from "../../objects/Dot"
import { Game } from "../../scenes/Game"
import { DamageType } from "../../ui/DamageNumbers"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

type DruidForm = "human" | "bear" | "cat"
export class Helyna extends Character {
    baseAttackSpeed = 1
    baseSpeed = 60
    baseAttackDamage = 20
    baseMaxMana = 150
    baseAbilityPower = 20
    baseAttackRange = 2
    baseArmor = 0

    abilityDescription: string = `Se transforma em um animal, baseado na posição inicial, concedendo atributos e habilidades específicas para cada um.\n
    Urso (frente): Tamanho, armadura, vida e ataque aumentados. Ao lançar, conjura uma armadura de espinhos, aumentando sua armadura e causando dano a atacantes.\n
    Gato (meio): Velocidade, ataque, velocidade de ataque e chance de crítico aumentados. Ao lançar, aplica um sangramento no alvo.\n
    Humano (atrás): Não se transforma em nada, mas sua habilidade cura o aliado com menos vida no campo.`

    bonusMaxHealth = 0
    bonusArmor = 0
    bonusScale = 0
    bonusAD = 0
    bonusSpeed = 0
    bonusAttackSpeed = 0
    bonusCriticalChance = 0
    bonusAttackRange = 0
    thornsArmor = false

    druidForm: DruidForm = "human"

    constructor(scene: Game, id: string) {
        super(scene, "statikk", id)
    }

    override extractAttackingAnimation() {
        this.attackAnimationImpactFrame = 3
        const attacking = this.extractAnimationsFromSpritesheet("attacking2", 1, 5, 13, "statikk_attacking")
        const specialAttacking = this.extractAnimationsFromSpritesheet("attacking1", 52, 6, 13, "statikk_attacking")

        console.log(this.width / 2, this.height / 2)
        const onUpdate = (animation: Phaser.Animations.Animation) => {
            if ([...attacking, ...specialAttacking].find((anim) => anim.key === animation.key)) {
                this.setOffset(this.width / 4, this.height / 4)
            } else {
                this.setOffset(0, 0)
            }
        }

        this.on("animationstart", onUpdate)
    }

    override castAbility(): void {
        this.casting = true

        switch (this.druidForm) {
            case "bear":
                this.castBearAbility()
                break
            case "cat":
                this.castCatAbility()
                break
            case "human":
                const placement = this.getPlacement()
                if (placement === "back") {
                    // human normal cast
                    this.castHumanAbility()
                } else {
                    this.shapeshift(placement === "front" ? "bear" : "cat")
                }
                break
        }

        this.casting = false
    }

    private shapeshift(form: DruidForm) {
        switch (form) {
            case "bear":
                return this.makeBear()
            case "cat":
                return this.makeCat()
        }
    }

    castHumanAbility() {
        const target = this.team.getLowestHealth()
        if (target) {
            const { value, crit } = this.calculateDamage(this.abilityPower * 5)
            target.heal(value, crit)
        }
    }

    castCatAbility() {
        if (!this.target) return

        // todo animation

        const bleeding = new Dot({
            damageType: "normal",
            duration: 2000,
            target: this.target,
            tickDamage: this.attackDamage * 3,
            tickRate: 1000,
            user: this,
        })
        this.target.applyStatusEffect(bleeding)
    }

    castBearAbility() {
        const duration = 3500
        this.manaLocked = true
        this.aura = this.postFX.addGlow(0x331111, 0)
        this.thornsArmor = true

        this.scene.tweens.add({
            targets: this.aura,
            duration,
            yoyo: true,
            repeat: 0,
            outerStrength: { from: 0, to: 2 },
            onComplete: () => {
                this.removeAura()
            },
        })

        this.scene.tweens.add({
            targets: this,
            duration: 50,
            armor: this.armor * 5,
            yoyo: true,
            hold: duration,
            repeat: 0,
            onComplete: () => {
                this.manaLocked = false
                this.thornsArmor = false
            },
        })
    }

    makeBear() {
        this.setTexture("bear")
        this.attackRange = 1
        this.maxHealth = this.bonusMaxHealth + this.abilityPower * 10
        this.setScale(this.bonusScale * 1.5)
        this.attackDamage = this.bonusAD + this.abilityPower * 0.25
        this.armor = this.bonusArmor + this.abilityPower * 0.15
    }

    makeCat() {
        this.setTexture("cat")
        this.attackRange = 1
        this.attackDamage = this.bonusAD + this.abilityPower
        this.attackSpeed = this.bonusAttackSpeed * 1.25
        this.speed = this.bonusSpeed * 1.5
        this.critChance = this.bonusCriticalChance + this.abilityPower / 100
    }

    dealThornsDamage(target: Creature) {
        const { value, crit } = this.calculateDamage(this.armor * 5)
        target.takeDamage(value, this, "normal", crit)
    }

    override reset(): void {
        super.reset()
        this.druidForm = "human"
        this.bonusSpeed = this.speed
        this.bonusMaxHealth = this.maxHealth
        this.bonusAD = this.attackDamage
        this.bonusArmor = this.armor
        this.bonusAttackSpeed = this.attackSpeed
        this.bonusCriticalChance = this.critChance
        this.bonusScale = this.scale
        this.bonusAttackRange = this.attackRange
        this.thornsArmor = false
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
    }

    override takeDamage(damage: number, attacker: Creature, type: DamageType, crit?: boolean): void {
        super.takeDamage(damage, attacker, type, crit)

        if (this.thornsArmor && attacker) {
            this.dealThornsDamage(attacker)
        }
    }
}

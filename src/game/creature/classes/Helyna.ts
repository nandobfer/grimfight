import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

type DruidForm = "human" | "bear" | "cat"
export class Helyna extends Character {
    baseAttackSpeed = 1
    baseSpeed = 60
    baseAttackDamage = 20
    baseMaxMana = 150
    baseAbilityPower = 20
    baseAttackRange = 2
    baseArmor = 3

    abilityDescription: string = `Se transforma em um animal, baseado na posição inicial, concedendo atributos e habilidades específicas para cada um.\n
    Urso (frente): Tamanho, armadura, vida e ataque aumentados. Ao lançar, conjura uma armadura de espinhos, aumentando sua armadura e causando dano a atacantes\n
    Gato (meio): Velocidade, velocidade de ataque e chance de crítico aumentados. ataca inimigos a sua frente\n
    Humano (atrás): Não se transforma em nada, mas sua habilidade cura o aliado com menos vida no campo.`

    bonusMaxHealth = 0
    bonusArmor = 0
    bonusScale = 0
    bonusAD = 0
    bonusSpeed = 0
    bonusAttackSpeed = 0
    bonusCriticalChance = 0
    bonusAttackRange = 0
    aura
    druidForm: DruidForm = "human"

    constructor(scene: Game, id: string) {
        super(scene, "statikk", id)

        this.aura = this.postFX.addGlow(0xddaa00, 0)
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
        const placement = this.getPlacement()

        if (this.druidForm === "human") {
            if (placement === "back") {
                // human normal cast
            } else {
                this.shapeshift(placement === "front" ? "bear" : "cat")
            }
        }

        if (this.druidForm === "bear") {
        }
        if (this.druidForm === "cat") {
        }
    }

    private shapeshift(form: DruidForm) {
        switch (form) {
            case "bear":
                return this.makeBear()
            case "cat":
                return this.makeCat()
        }
    }

    // multiplicar por AP!

    makeBear() {
        this.setTexture("bear")
        this.attackRange = 1
        this.maxHealth = this.bonusMaxHealth * ((2 * this.abilityPower) / 100 + 1)
        this.setScale(this.bonusScale * 1.5)
        this.attackDamage = this.bonusAD * 1.2
        this.armor = this.bonusArmor * 2
    }

    makeCat() {
        // todo trocar textura da sprite?

        this.setTexture("cat")
        this.attackRange = 1
        this.attackDamage = this.bonusAD * 1.5
        this.attackSpeed = this.bonusAttackSpeed + 2
    }

    override reset(): void {
        super.reset()
        this.bonusSpeed = this.speed
        this.bonusMaxHealth = this.maxHealth
        this.bonusAD = this.attackDamage
        this.bonusArmor = this.armor
        this.bonusAttackSpeed = this.attackSpeed
        this.bonusCriticalChance = this.critChance
        this.bonusScale = this.scale
        this.bonusAttackRange = this.attackRange
    }

    override update(time: number, delta: number): void {
        super.update(time, delta)
    }
}

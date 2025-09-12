import { MagicShieldFx } from "../../fx/MagicShieldFx"
import { Freeze } from "../../objects/StatusEffect/Freeze"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Character } from "../character/Character"
import { Creature } from "../Creature"

export class Ymir extends Character {
    baseMaxHealth = 425
    baseArmor = 10
    baseAttackDamage = 15
    baseMaxMana = 120

    abilityName = "Aura Congelante"

    constructor(scene: Game, id: string) {
        super(scene, "ymir", id)


        this.on("damage-taken", this.tryFreezeAttacker, this)
        this.once("destroy", () => this.off("damage-taken", this.tryFreezeAttacker, this))
    }

    override getAbilityDescription(): string {
        return `Passivo: Ao ser atacado, tem 10% de chance de congelar o atacante por 1 segundo.

Emite uma onda congelante que se expande ao seu redor. Para cada inimigo atingido e congelado, recebe um escudo que absorbe [success.main:${Math.round(
            this.abilityPower
        )}] [info.main:(100% AP)]`
    }

    castAbility(): void {
        this.casting = true

        const enemiesFrozen = new Set<Creature>()

        const graphic = this.scene.add
            .graphics()
            .setDepth(this.depth + 5)
            .setBlendMode(Phaser.BlendModes.ADD) // nice icy glow
        const ringWidth = 16
        const maxRadius = 260
        const duration = 420

        // keep him still during cast
        this.moveLocked = true

        const resolveShield = () => {
            graphic.destroy(true)
            this.moveLocked = false
            this.casting = false

            new MagicShieldFx(this.scene, this.x, this.y, 0.4)
            this.gainShield(this.abilityPower * enemiesFrozen.size)
        }

        const tween = this.scene.tweens.addCounter({
            from: 0,
            to: maxRadius,
            duration,
            ease: "Cubic.easeOut",
            // ease: 'Expo.easeOut'
            onUpdate: (tween: Phaser.Tweens.Tween) => {
                const radius = tween.getValue() as number

                graphic.clear()
                graphic.lineStyle(ringWidth, 0x99ddff, 1)
                graphic.strokeCircle(this.x, this.y, radius)

                const enemies = this.scene.enemyTeam.getChildren(true, true)
                for (const enemy of enemies) {
                    if (!enemy.active || enemiesFrozen.has(enemy)) continue

                    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
                    if (distance <= radius) {
                        enemiesFrozen.add(enemy)
                        new Freeze(enemy, this, 1000).start()
                    }
                }
            },
            onComplete: resolveShield,
            onStop: resolveShield
        })

        this.scene.events.once('gamestate', () => {
            tween.stop()
        })
    }

    tryFreezeAttacker(damage: number, attacker: Creature) {
        if (RNG.chance() <= 10) {
            const freeze = new Freeze(attacker, this, 1000)
            freeze.start()
        }
    }
}

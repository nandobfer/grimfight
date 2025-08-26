import { Deathbolt } from "../../objects/Deathbolt"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"
import { MonsterRegistry } from "../monsters/MonsterRegistry"

export class Warlock extends Character {
    baseAttackSpeed = 0.85
    baseAttackDamage = 15
    baseAttackRange = 2
    baseManaPerSecond = 10
    baseMaxMana = 150
    baseMaxHealth = 300
    baseArmor: number = 5
    baseAbilityPower: number = 50

    abilityDescription: string = "Sumona um esqueletinho para lutar ao seu lado até a morte"

    constructor(scene: Game, id: string) {
        super(scene, "warlock", id)
        this.attackAnimationImpactFrame = 6
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 1, 6)
        this.extractAnimationsFromSpritesheet("attacking2", 1, 6)

        this.extractAnimationsFromSpritesheet("casting", 208, 13)
    }

    override landAttack() {
        if (!this.target) return

        const deathbolt = new Deathbolt(this)

        deathbolt.fire(this.target)
    }

    override castAbility(): void {
        this.casting = true

        const skeleton = MonsterRegistry.create("skeleton", this.scene)
        skeleton.master = this
        this.team.minions.add(skeleton)

        skeleton.teleportTo(this.x, this.y)
        this.spawnSmoke()
        skeleton.baseScale = 0.7
        skeleton.addAura(0x00ff66, 1)
        skeleton.baseSpeed = this.baseSpeed
        skeleton.baseAttackDamage += this.abilityPower * 0.07
        skeleton.baseMaxHealth += this.abilityPower
        skeleton.reset()
        skeleton.target = this.target

        this.casting = false
    }

    private spawnSmoke(): void {
        const smokeParticles = this.scene.add.particles(this.x, this.y, "blood", {
            lifespan: { min: 300, max: 600 },
            speed: { min: 20, max: 60 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 },
            quantity: 8,
            blendMode: "NORMAL",
            tint: 0x00ff66,
            angle: { min: 0, max: 360 },
            gravityY: -20,
        })

        // Explode the particles (one-time burst)
        smokeParticles.explode(15)

        // Auto-destroy after particles finish
        this.scene.time.delayedCall(600, () => {
            smokeParticles.destroy()
        })
    }

    override reset(): void {
        super.reset()

        this.mana = this.maxMana * 0.65
    }
}

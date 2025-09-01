import { Character } from "../../creature/character/Character"
import { Game } from "../../scenes/Game"
import { Trait } from "./Trait"

type TraitBoosts = "hpMultiplier" | 'statsMultiplier'

export class DeathEaterTrait extends Trait {
    name = "Deatheater"
    description = "Ao morrer pela primeira vez, comensais da morte ressuscitam com {0} de vida e recebem {1} de AD e AP até morrer de novo."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([[2, { hpMultiplier: 0.3, statsMultiplier: 0.5, descriptionParams: ["30%", "50%"] }]])

    private dead = new Set<Character>()

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.deathEaterTrait
        if (previousHandler) {
            character.off("died", previousHandler)
        }

        const diedHandler = () => {
            if (this.dead.has(character)) return

            this.dead.add(character)
            const deadX = character.x
            const deadY = character.y
            this.spawnRessurrectionFx(character.scene, deadX, deadY)
            character.scene?.time.delayedCall(1000, () => {
                if (character.scene.state === "fighting") {
                    this.spawnRessurrectionFx(character.scene, deadX, deadY)
                    character.reset()
                    character.health = character.maxHealth * values.hpMultiplier
                    character.attackDamage *= 1 + values.statsMultiplier
                    character.abilityPower *= 1 + values.statsMultiplier
                    character.teleportTo(deadX, deadY)
                }
            })
        }

        character.eventHandlers.deathEaterTrait = diedHandler

        character.on("died", diedHandler)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.deathEaterTrait
        if (handler) {
            character.off("died", handler)
            delete character.eventHandlers.deathEaterTrait
        }

        this.dead.delete(character)
    }

    private spawnRessurrectionFx(scene: Game, x: number, y: number): void {
        const smokeParticles = scene.add.particles(x, y, "blood", {
            lifespan: { min: 300, max: 600 },
            speed: { min: 20, max: 60 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 },
            quantity: 8,
            // blendMode: "NORMAL",
            tint: 0xfff,
            angle: { min: 0, max: 360 },
            gravityY: -20,
        })

        // Explode the particles (one-time burst)
        smokeParticles.explode(15)

        // Auto-destroy after particles finish
        scene.time.delayedCall(600, () => {
            smokeParticles.destroy()
        })
    }
}

import { Character } from "../../creature/character/Character"
import { Creature } from "../../creature/Creature"
import { DeathSkullFx } from "../../fx/DeathSkullFx"
import { Xfx } from "../../fx/Xfx"
import { Trait } from "./Trait"

type TraitBoosts = "bonusCritChance" | "bonusCritMultiplier"

export class AssassinTrait extends Trait {
    name = "Assassin"
    description =
        "Assassins gain {0} critical hit chance and each successful kill grants {1} to their critical damage multiplier, permanently."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { bonusCritChance: 20, bonusCritMultiplier: 0.01, descriptionParams: ["20%", "1%"] }],
        [4, { bonusCritChance: 40, bonusCritMultiplier: 0.04, descriptionParams: ["20%", "2%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.assassinTrait
        if (previousHandler) {
            character.off("kill", previousHandler)
        }

        const killHandler = (killed: Creature) => {
            character.baseCritDamageMultiplier += values.bonusCritMultiplier
            new Xfx(character.scene, killed.x, killed.y)
            const deathFx = new DeathSkullFx(character.scene, killed.x, killed.y, 0.3)
            character.scene.tweens.add({
                targets: deathFx,
                x: character.x,
                y: character.y,
                duration: 400,
                onUpdate: (tween) => {
                    tween.updateTo("x", character.x)
                    tween.updateTo("y", character.y)
                },
            })
        }

        character.eventHandlers.assassinTrait = killHandler
        character.critChance += values.bonusCritChance

        character.on("kill", killHandler)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.assassinTrait
        if (handler) {
            character.off("kill", handler)
            delete character.eventHandlers.assassinTrait
        }
    }
}

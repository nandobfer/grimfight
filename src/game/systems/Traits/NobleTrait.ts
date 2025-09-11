import { Character } from "../../creature/character/Character"
import { Creature } from "../../creature/Creature"
import { RNG } from "../../tools/RNG"
import { Trait } from "./Trait"

type TraitBoosts = "goldDropChance"

export class NobleTrait extends Trait {
    name = "Nobre"
    description = "Ao abater um inimigo, nobres tem {0} de chance de dropar ouro equivalente a seu nível."
    stages: Map<number, Record<TraitBoosts, any>> = new Map([
        [2, { goldDropChance: 15, descriptionParams: ["15%"] }],
        [4, { goldDropChance: 40, descriptionParams: ["40%"] }],
    ])

    constructor(comp: string[]) {
        super(comp)
        this.setMaxStage()
    }

    override applyModifier(character: Character): void {
        const values = this.stages.get(this.activeStage)
        if (!values) return

        const previousHandler = character.eventHandlers.nobleTrait
        if (previousHandler) {
            character.off("kill", previousHandler)
        }

        const killHandler = (killed: Creature) => {
            const random = RNG.chance()
            if (random <= values.goldDropChance && character?.scene) {
                character.scene.changePlayerGold(character.level)
                character.scene.goldCoinFx.explodeCameraCenterToCounter(character.level)
            }
        }

        character.eventHandlers.nobleTrait = killHandler

        character.on("kill", killHandler)
        character.once("destroy", () => this.cleanup(character))
    }

    override cleanup(character: Character) {
        const handler = character.eventHandlers.nobleTrait
        if (handler) {
            character.off("kill", handler)
            delete character.eventHandlers.nobleTrait
        }
    }
}

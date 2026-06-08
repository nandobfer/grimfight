import type { Creature } from "../Creature"

export abstract class CreatureVisualDefinition {
    abstract readonly textureKey: string
    readonly initialFrame?: string | number

    abstract preload(scene: Phaser.Scene): void

    abstract createAnimations(creature: Creature): void
}

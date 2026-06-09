import type { Creature } from "../Creature"
import { CreatureVisualDefinition } from "./CreatureVisualDefinition"

export interface SpritesheetCreatureVisualConfig {
    textureKey: string
    path: string
    frameWidth: number
    frameHeight?: number
    startFrame?: number
    endFrame?: number
    initialFrame?: number
}

export class SpritesheetCreatureVisualDefinition extends CreatureVisualDefinition {
    readonly textureKey: string
    override readonly initialFrame?: number

    private readonly path: string
    private readonly frameConfig: Phaser.Types.Loader.FileTypes.ImageFrameConfig

    constructor(config: SpritesheetCreatureVisualConfig) {
        super()
        this.textureKey = config.textureKey
        this.initialFrame = config.initialFrame
        this.path = config.path
        this.frameConfig = {
            frameWidth: config.frameWidth,
            frameHeight: config.frameHeight,
            startFrame: config.startFrame,
            endFrame: config.endFrame,
        }
    }

    static character(name: string): SpritesheetCreatureVisualDefinition {
        return new SpritesheetCreatureVisualDefinition({
            textureKey: name,
            path: `spritesheets/characters/${name}.png`,
            frameWidth: 64,
        })
    }

    override preload(scene: Phaser.Scene): void {
        scene.load.spritesheet(this.textureKey, this.path, this.frameConfig)
    }

    override createAnimations(creature: Creature): void {
        creature.extractAnimationsFromSpritesheet("walking", 104, 9)
        creature.extractAnimationsFromSpritesheet("idle", 286, 2)
        creature.extractAttackingAnimation()
    }
}

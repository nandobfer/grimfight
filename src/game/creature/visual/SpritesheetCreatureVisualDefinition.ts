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

const svgSpritesheetTotalFramesPerRow = 9
const svgSpritesheetAttacking1ImpactFrame = 5
const svgSpritesheetAttacking2ImpactFrame = 4

const svgSpritesheetAnimations = [
    { key: "idle", startingFrame: 0, usedFramesPerRow: 2 },
    { key: "walking", startingFrame: 36, usedFramesPerRow: 9 },
    { key: "attacking1", startingFrame: 72, usedFramesPerRow: 8 },
    { key: "attacking2", startingFrame: 108, usedFramesPerRow: 6 },
    { key: "casting", startingFrame: 144, usedFramesPerRow: 7 },
] as const

export class SvgSpritesheetCreatureVisualDefinition extends SpritesheetCreatureVisualDefinition {
    constructor(textureKey: string, path: string) {
        super({
            textureKey,
            path,
            frameWidth: 64,
            frameHeight: 64,
        })
    }

    static character(name: string): SvgSpritesheetCreatureVisualDefinition {
        return new SvgSpritesheetCreatureVisualDefinition(name, `spritesheets/characters/${name}.svg`)
    }

    override createAnimations(creature: Creature): void {
        for (const animation of svgSpritesheetAnimations) {
            creature.extractAnimationsFromSpritesheet(
                animation.key,
                animation.startingFrame,
                animation.usedFramesPerRow,
                svgSpritesheetTotalFramesPerRow,
                this.textureKey,
                creature.name
            )
        }

        creature.setAttackAnimationImpactFrame("attacking1", svgSpritesheetAttacking1ImpactFrame)
        creature.setAttackAnimationImpactFrame("attacking2", svgSpritesheetAttacking2ImpactFrame)
    }
}

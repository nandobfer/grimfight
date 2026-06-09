import type { Creature } from "../Creature"
import { CreatureVisualDefinition } from "./CreatureVisualDefinition"
import {
    assertJsonAtlasAnimationFrames,
    getJsonAtlasFrameRate,
    parseJsonAtlasAnimationName,
} from "./JsonAtlasAnimation"
import type { JsonAtlasData } from "./JsonAtlasAnimation"

export interface JsonAtlasCreatureVisualConfig {
    textureKey: string
    texturePath: string
    atlasPath: string
    jsonKey?: string
    initialFrame?: string
    frameRate?: number
    repeat?: number
}

export class JsonAtlasCreatureVisualDefinition extends CreatureVisualDefinition {
    readonly textureKey: string
    override readonly initialFrame?: string

    private readonly texturePath: string
    private readonly atlasPath: string
    private readonly jsonKey: string
    private readonly fallbackFrameRate: number
    private readonly repeat: number

    constructor(config: JsonAtlasCreatureVisualConfig) {
        super()
        this.textureKey = config.textureKey
        this.initialFrame = config.initialFrame
        this.texturePath = config.texturePath
        this.atlasPath = config.atlasPath
        this.jsonKey = config.jsonKey ?? `${config.textureKey}-atlas-data`
        this.fallbackFrameRate = config.frameRate ?? 12
        this.repeat = config.repeat ?? -1
    }

    static character(name: string, initialFrame?: string): JsonAtlasCreatureVisualDefinition {
        return new JsonAtlasCreatureVisualDefinition({
            textureKey: name,
            texturePath: `spritesheets/characters/${name}.png`,
            atlasPath: `spritesheets/characters/${name}.json`,
            initialFrame,
        })
    }

    override preload(scene: Phaser.Scene): void {
        scene.load.atlas(this.textureKey, this.texturePath, this.atlasPath)
        scene.load.json(this.jsonKey, this.atlasPath)
    }

    override createAnimations(creature: Creature): void {
        const data = creature.scene.cache.json.get(this.jsonKey) as JsonAtlasData | undefined
        if (!data?.animations) {
            throw new Error(`Atlas animation metadata not found for "${this.textureKey}"`)
        }

        const frameRate = getJsonAtlasFrameRate(data, this.fallbackFrameRate)

        for (const [atlasAnimationName, frameNames] of Object.entries(data.animations)) {
            if (!frameNames?.length) continue

            const { action, direction } = parseJsonAtlasAnimationName(atlasAnimationName)
            assertJsonAtlasAnimationFrames(data, atlasAnimationName, frameNames)

            creature.anims.create({
                key: `${creature.name}-${action}-${direction}`,
                frames: frameNames.map((frame) => ({ key: this.textureKey, frame })),
                frameRate,
                repeat: this.repeat,
            })
        }
    }
}

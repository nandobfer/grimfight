import { EffectAnimationConfig, EffectVisualDefinition } from "./EffectVisualDefinition"

export interface SpritesheetEffectVisualConfig {
    textureKey: string
    path: string
    frameWidth: number
    frameHeight?: number
    startFrame?: number
    endFrame?: number
    animationKey?: string
    animationStartFrame?: number
    animationEndFrame?: number
    frameRate?: number
    repeat?: number
    yoyo?: boolean
    hideOnComplete?: boolean
}

export class SpritesheetEffectVisualDefinition extends EffectVisualDefinition {
    readonly textureKey: string

    private readonly path: string
    private readonly frameConfig: Phaser.Types.Loader.FileTypes.ImageFrameConfig
    private readonly animationKey: string
    private readonly animationStartFrame?: number
    private readonly animationEndFrame?: number
    private readonly frameRate: number
    private readonly repeat: number
    private readonly yoyo?: boolean
    private readonly hideOnComplete?: boolean

    constructor(config: SpritesheetEffectVisualConfig) {
        super()
        this.textureKey = config.textureKey
        this.path = config.path
        this.frameConfig = {
            frameWidth: config.frameWidth,
            frameHeight: config.frameHeight,
            startFrame: config.startFrame,
            endFrame: config.endFrame,
        }
        this.animationKey = config.animationKey ?? config.textureKey
        this.animationStartFrame = config.animationStartFrame
        this.animationEndFrame = config.animationEndFrame
        this.frameRate = config.frameRate ?? 15
        this.repeat = config.repeat ?? 0
        this.yoyo = config.yoyo
        this.hideOnComplete = config.hideOnComplete
    }

    static particle(name: string): SpritesheetEffectVisualDefinition {
        return new SpritesheetEffectVisualDefinition({
            textureKey: name,
            path: `particles/${name}.png`,
            frameWidth: 64,
        })
    }

    override preload(scene: Phaser.Scene): void {
        scene.load.spritesheet(this.textureKey, this.path, this.frameConfig)
    }

    override createAnimation(sprite: Phaser.GameObjects.Sprite, config: EffectAnimationConfig = {}): string {
        const animationKey = config.animationKey ?? this.animationKey
        if (!sprite.scene.anims.exists(animationKey)) {
            sprite.scene.anims.create({
                key: animationKey,
                frames: sprite.anims.generateFrameNumbers(this.textureKey, {
                    start: config.startFrame ?? this.animationStartFrame,
                    end: config.endFrame ?? this.animationEndFrame,
                }),
                frameRate: config.frameRate ?? this.frameRate,
                repeat: config.repeat ?? this.repeat,
                yoyo: config.yoyo ?? this.yoyo,
                hideOnComplete: config.hideOnComplete ?? this.hideOnComplete,
            })
        }

        return animationKey
    }
}

export class SvgSpritesheetEffectVisualDefinition extends SpritesheetEffectVisualDefinition {
    constructor(textureKey: string, path: string, config: Omit<SpritesheetEffectVisualConfig, "textureKey" | "path" | "frameWidth" | "frameHeight"> = {}) {
        super({
            textureKey,
            path,
            frameWidth: 64,
            frameHeight: 64,
            animationStartFrame: 0,
            animationEndFrame: 9,
            ...config,
        })
    }

    static fx(name: string, config?: Omit<SpritesheetEffectVisualConfig, "textureKey" | "path" | "frameWidth" | "frameHeight">): SvgSpritesheetEffectVisualDefinition {
        return new SvgSpritesheetEffectVisualDefinition(name, `particles/${name}.svg`, config)
    }

    static projectile(name: string, config?: Omit<SpritesheetEffectVisualConfig, "textureKey" | "path" | "frameWidth" | "frameHeight">): SvgSpritesheetEffectVisualDefinition {
        return new SvgSpritesheetEffectVisualDefinition(name, `particles/${name}.svg`, {
            repeat: -1,
            ...config,
        })
    }
}

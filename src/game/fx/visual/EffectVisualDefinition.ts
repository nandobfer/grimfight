export interface EffectAnimationConfig {
    animationKey?: string
    startFrame?: number
    endFrame?: number
    frameRate?: number
    repeat?: number
    yoyo?: boolean
    hideOnComplete?: boolean
}

export abstract class EffectVisualDefinition {
    abstract readonly textureKey: string

    abstract preload(scene: Phaser.Scene): void

    abstract createAnimation(sprite: Phaser.GameObjects.Sprite, config?: EffectAnimationConfig): string
}

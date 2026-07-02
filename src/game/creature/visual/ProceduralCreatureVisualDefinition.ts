import type { Creature, Direction } from "../Creature"
import { CreatureVisualDefinition } from "./CreatureVisualDefinition"

export type ProceduralCreatureAction = "idle" | "walking" | "attacking1" | "attacking2" | "casting"

export interface ProceduralCreatureFrameContext {
    scene: Phaser.Scene
    graphics: Phaser.GameObjects.Graphics
    textureKey: string
    action: ProceduralCreatureAction
    direction: Direction
    frame: number
    frameCount: number
    width: number
    height: number
}

export type ProceduralCreatureFramePainter = (context: ProceduralCreatureFrameContext) => void

export interface ProceduralCreatureVisualConfig {
    textureKey: string
    frameWidth?: number
    frameHeight?: number
    frameRate?: number
    drawFrame: ProceduralCreatureFramePainter
}

const proceduralCreatureDirections: Direction[] = ["up", "left", "down", "right"]

const proceduralCreatureAnimations = [
    { key: "idle", frameCount: 2 },
    { key: "walking", frameCount: 9 },
    { key: "attacking1", frameCount: 8 },
    { key: "attacking2", frameCount: 6 },
    { key: "casting", frameCount: 7 },
] as const satisfies readonly { key: ProceduralCreatureAction; frameCount: number }[]

const proceduralCreatureAttacking1ImpactFrame = 5
const proceduralCreatureAttacking2ImpactFrame = 4

export class ProceduralCreatureVisualDefinition extends CreatureVisualDefinition {
    readonly textureKey: string
    override readonly initialFrame?: number

    private readonly baseTextureKey: string
    private readonly frameWidth: number
    private readonly frameHeight: number
    private readonly frameRate?: number
    private readonly drawFrame: ProceduralCreatureFramePainter

    constructor(config: ProceduralCreatureVisualConfig) {
        super()
        this.baseTextureKey = config.textureKey
        this.textureKey = this.getFrameTextureKey("idle", "down", 0)
        this.initialFrame = undefined
        this.frameWidth = config.frameWidth ?? 64
        this.frameHeight = config.frameHeight ?? 64
        this.frameRate = config.frameRate
        this.drawFrame = config.drawFrame
    }

    override preload(scene: Phaser.Scene): void {
        const graphics = scene.add.graphics()

        try {
            for (const animation of proceduralCreatureAnimations) {
                for (const direction of proceduralCreatureDirections) {
                    for (let frame = 0; frame < animation.frameCount; frame++) {
                        const textureKey = this.getFrameTextureKey(animation.key, direction, frame)
                        if (scene.textures.exists(textureKey)) continue

                        graphics.clear()
                        this.drawFrame({
                            scene,
                            graphics,
                            textureKey,
                            action: animation.key,
                            direction,
                            frame,
                            frameCount: animation.frameCount,
                            width: this.frameWidth,
                            height: this.frameHeight,
                        })
                        graphics.generateTexture(textureKey, this.frameWidth, this.frameHeight)
                    }
                }
            }
        } finally {
            graphics.destroy()
        }
    }

    override createAnimations(creature: Creature): void {
        for (const animation of proceduralCreatureAnimations) {
            for (const direction of proceduralCreatureDirections) {
                const animationKey = `${creature.name}-${animation.key}-${direction}`
                if (creature.scene.anims.exists(animationKey)) continue

                creature.anims.create({
                    key: animationKey,
                    frames: Array.from({ length: animation.frameCount }, (_, frame) => ({
                        key: this.getFrameTextureKey(animation.key, direction, frame),
                    })),
                    frameRate: this.frameRate ?? animation.frameCount + 1,
                    repeat: -1,
                })
            }
        }

        creature.setAttackAnimationImpactFrame("attacking1", proceduralCreatureAttacking1ImpactFrame)
        creature.setAttackAnimationImpactFrame("attacking2", proceduralCreatureAttacking2ImpactFrame)
    }

    private getFrameTextureKey(action: ProceduralCreatureAction, direction: Direction, frame: number): string {
        return `${this.baseTextureKey}-${action}-${direction}-${frame}`
    }
}

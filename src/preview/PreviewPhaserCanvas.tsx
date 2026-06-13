import { useLayoutEffect, useRef } from "react"
import * as Phaser from "phaser"
import type { PreviewAsset } from "./previewAssets"
import { creaturePreviewAnimations, creaturePreviewDirections, creaturePreviewTotalFramesPerRow, fxPreviewFrameCount } from "./previewAnimations"

interface PreviewPhaserCanvasProps {
    asset: PreviewAsset
}

class AssetPreviewScene extends Phaser.Scene {
    constructor(private readonly asset: PreviewAsset) {
        super(`AssetPreviewScene-${asset.type}-${asset.name}`)
    }

    preload(): void {
        this.load.spritesheet(this.textureKey, this.asset.path, {
            frameWidth: 64,
            frameHeight: 64,
        })
    }

    create(): void {
        this.cameras.main.setBackgroundColor("#10131c")

        if (this.asset.type === "creature") {
            this.createCreaturePreview()
            return
        }

        this.createFxPreview()
    }

    private get textureKey(): string {
        return `preview-${this.asset.type}-${this.asset.name}`
    }

    private createCreaturePreview(): void {
        const cellWidth = 220
        const cellHeight = 126
        const startX = 150
        const startY = 94

        this.add
            .text(24, 18, `${this.asset.name} creature spritesheet`, {
                color: "#f8fafc",
                fontFamily: "monospace",
                fontSize: "18px",
            })
            .setDepth(2)

        for (const [row, animation] of creaturePreviewAnimations.entries()) {
            for (const [column, direction] of creaturePreviewDirections.entries()) {
                const x = startX + column * cellWidth
                const y = startY + row * cellHeight
                const startingFrame = animation.startingFrame + column * creaturePreviewTotalFramesPerRow
                const animationKey = `${this.textureKey}-${animation.key}-${direction}`

                this.drawCell(x, y, cellWidth - 18, cellHeight - 14)
                this.addLabel(`${animation.key} ${direction}`, x, y - 48)

                if (!this.anims.exists(animationKey)) {
                    this.anims.create({
                        key: animationKey,
                        frames: this.anims.generateFrameNumbers(this.textureKey, {
                            start: startingFrame,
                            end: startingFrame + animation.usedFramesPerRow - 1,
                        }),
                        frameRate: animation.usedFramesPerRow + 1,
                        repeat: -1,
                    })
                }

                this.add.sprite(x, y + 12, this.textureKey).setScale(2).play(animationKey)
            }
        }
    }

    private createFxPreview(): void {
        const animationKey = `${this.textureKey}-loop`
        if (!this.anims.exists(animationKey)) {
            this.anims.create({
                key: animationKey,
                frames: this.anims.generateFrameNumbers(this.textureKey, { start: 0, end: fxPreviewFrameCount - 1 }),
                frameRate: 15,
                repeat: -1,
            })
        }

        this.add
            .text(24, 18, `${this.asset.name} FX spritesheet`, {
                color: "#f8fafc",
                fontFamily: "monospace",
                fontSize: "18px",
            })
            .setDepth(2)
        this.drawCell(360, 260, 260, 220)
        this.addLabel("loop", 360, 168)
        this.add.sprite(360, 280, this.textureKey).setScale(4).play(animationKey)
    }

    private drawCell(centerX: number, centerY: number, width: number, height: number): void {
        this.add.rectangle(centerX, centerY, width, height, 0x171b27, 0.88).setStrokeStyle(1, 0x334155, 0.8)
    }

    private addLabel(label: string, x: number, y: number): void {
        this.add
            .text(x, y, label, {
                color: "#cbd5e1",
                fontFamily: "monospace",
                fontSize: "13px",
            })
            .setOrigin(0.5)
            .setDepth(2)
    }
}

export function PreviewPhaserCanvas({ asset }: PreviewPhaserCanvasProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return undefined

        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: container,
            width: asset.type === "creature" ? 960 : 720,
            height: asset.type === "creature" ? 700 : 560,
            transparent: false,
            antialias: true,
            scene: new AssetPreviewScene(asset),
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            render: { antialias: true },
            fps: { target: 60, smoothStep: true },
        })

        return () => {
            game.destroy(true)
        }
    }, [asset])

    return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 360 }} />
}

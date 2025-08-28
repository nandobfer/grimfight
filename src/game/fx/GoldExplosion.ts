// GoldCoinFx.ts
import { Game } from "../scenes/Game"

export class GoldCoinFx {
    private scene: Game
    private textureKey = "goldcoin"

    constructor(scene: Game) {
        this.scene = scene
    }

    /**
     * Bigger scatter + fly to top-right corner (kept, with larger defaults).
     */
    explodeToCorner(
        quantity: number,
        x: number,
        y: number,
        opts?: { scatterMin?: number; scatterMax?: number; hold?: number; flyDuration?: number; margin?: number; depth?: number; endScale?: number }
    ) {
        const scatterMin = opts?.scatterMin ?? 120
        const scatterMax = opts?.scatterMax ?? 240
        const hold = opts?.hold ?? 200
        const flyDuration = opts?.flyDuration ?? 600
        const margin = opts?.margin ?? 16
        const depth = opts?.depth ?? 1000
        const endScale = opts?.endScale ?? 0.35 // shrink as it flies

        const cam = this.scene.cameras.main
        const targetX = cam.worldView.right - margin
        const targetY = cam.worldView.top + margin

        this.spawnAndAnimate(quantity, x, y, targetX, targetY, { scatterMin, scatterMax, hold, flyDuration, depth, endScale })
    }

    /**
     * Explode from (x,y) then fly to the center of a DOM element (by id), shrinking.
     * Great for sending coins to a React HUD counter.
     */
    explodeToElement(
        quantity: number,
        x: number,
        y: number,
        elementId: string,
        opts?: { scatterMin?: number; scatterMax?: number; hold?: number; flyDuration?: number; depth?: number; endScale?: number; margin?: number }
    ) {
        const { x: targetX, y: targetY } = this.getWorldPointFromElementCenter(elementId, opts?.margin) ?? this.fallbackTopRight(opts?.margin)

        const scatterMin = opts?.scatterMin ?? 120
        const scatterMax = opts?.scatterMax ?? 240
        const hold = opts?.hold ?? 200
        const flyDuration = opts?.flyDuration ?? 600
        const depth = opts?.depth ?? 1000
        const endScale = opts?.endScale ?? 0.35

        this.spawnAndAnimate(quantity, x+50, y, targetX, targetY, { scatterMin, scatterMax, hold, flyDuration, depth, endScale })
    }

    /** Convenience: explode from camera center to the element */
    explodeCameraCenterToCounter(quantity: number, opts?: Parameters<GoldCoinFx["explodeToElement"]>[4]) {
        const cam = this.scene.cameras.main
        const cx = cam.worldView.centerX
        const cy = cam.worldView.centerY
        this.explodeToElement(quantity, cx, cy, 'gold-coin-counter', opts)
    }

    // ----------------- internals -----------------

    private spawnAndAnimate(
        quantity: number,
        ox: number,
        oy: number,
        targetX: number,
        targetY: number,
        opts: { scatterMin: number; scatterMax: number; hold: number; flyDuration: number; depth: number; endScale: number }
    ) {
        // spread angles evenly with slight jitter to avoid clumping
        for (let i = 0; i < quantity; i++) {
            const coin = this.scene.add.image(ox, oy, this.textureKey).setDepth(opts.depth).setScale(0.5).setAlpha(1)

            const baseAngle = (i / quantity) * Math.PI * 2
            const jitter = Phaser.Math.FloatBetween(-0.3, 0.3)
            const angle = baseAngle + jitter
            const dist = Phaser.Math.Between(opts.scatterMin, opts.scatterMax)
            const sx = ox + Math.cos(angle) * dist
            const sy = oy + Math.sin(angle) * dist

            // 1) quick scatter
            this.scene.tweens.add({
                targets: coin,
                x: sx,
                y: sy,
                duration: 200,
                ease: "Sine.easeOut",
                onComplete: () => {
                    // 2) short hold, then fly to target & fade + shrink
                    this.scene.time.delayedCall(opts.hold, () => {
                        this.scene.tweens.add({
                            targets: coin,
                            x: targetX,
                            y: targetY,
                            alpha: 0,
                            scale: opts.endScale,
                            duration: opts.flyDuration,
                            ease: "Quad.easeIn",
                            onComplete: () => coin.destroy(),
                        })
                    })
                },
            })
        }
    }

    private fallbackTopRight(margin = 16) {
        const cam = this.scene.cameras.main
        return { x: cam.worldView.right - margin, y: cam.worldView.top + margin }
    }

    /**
     * Convert the center of a DOM element (by id) into WORLD coordinates.
     * Returns null if the element isn't found/visible; caller should fallback.
     */
    private getWorldPointFromElementCenter(elementId: string, pad = 0): { x: number; y: number } | null {
        const el = document.getElementById(elementId)
        if (!el) return null

        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) return null

        // center of the element in page (client) coords
        const pageX = rect.left + rect.width / 2
        const pageY = rect.top + rect.height / 2

        // convert page -> game -> world
        const gx = this.scene.scale.transformX(pageX)
        const gy = this.scene.scale.transformY(pageY)
        const cam = this.scene.cameras.main
        const wp = cam.getWorldPoint(gx, gy)

        // optional padding (e.g., if you want to nudge inside the element)
        return { x: wp.x - pad, y: wp.y - pad }
    }
}

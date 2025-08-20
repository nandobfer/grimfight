import Phaser from "phaser"

const TEX_PARRY = "parry_star"
const TEX_STREAK = "parry_streak"

export function ensureParryTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists(TEX_PARRY)) {
        const size = 48
        const cx = size / 2
        const cy = size / 2

        const g = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD)

        // Outer soft rays (yellow)
        g.fillStyle(0xfff176, 0.55)
        drawBurst(g, cx, cy, { rays: 12, inner: 6, outer: 20, halfWidth: 4 })

        // Mid rays (warm white)
        g.fillStyle(0xffffcc, 0.9)
        drawBurst(g, cx, cy, { rays: 8, inner: 4, outer: 16, halfWidth: 3 })

        // Core
        g.fillStyle(0xffffff, 1)
        g.fillCircle(cx, cy, 3)

        g.generateTexture(TEX_PARRY, size, size)
        g.destroy()
    }

    if (!scene.textures.exists(TEX_STREAK)) {
        const g2 = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD)
        // a tiny rounded streak (2x10)
        g2.fillStyle(0xffffaa, 1)
        g2.fillRoundedRect(0, 0, 2, 10, 1)
        g2.generateTexture(TEX_STREAK, 2, 10)
        g2.destroy()
    }
}

type BurstOpts = { rays: number; inner: number; outer: number; halfWidth: number }

function drawBurst(g: Phaser.GameObjects.Graphics, cx: number, cy: number, opts: BurstOpts) {
    const { rays, inner, outer, halfWidth } = opts
    for (let i = 0; i < rays; i++) {
        const ang = (i / rays) * Math.PI * 2
        const nx = Math.cos(ang + Math.PI / 2)
        const ny = Math.sin(ang + Math.PI / 2)

        const tip = new Phaser.Geom.Point(cx + Math.cos(ang) * outer, cy + Math.sin(ang) * outer)
        const bl = new Phaser.Geom.Point(cx + Math.cos(ang) * inner + nx * halfWidth, cy + Math.sin(ang) * inner + ny * halfWidth)
        const br = new Phaser.Geom.Point(cx + Math.cos(ang) * inner - nx * halfWidth, cy + Math.sin(ang) * inner - ny * halfWidth)

        g.fillPoints([tip, bl, br], true)
    }
}

export function spawnParrySpark(
    scene: Phaser.Scene,
    x: number,
    y: number,
    incomingAngleRad?: number // optional: direction of the incoming hit/weapon
): void {
    ensureParryTextures(scene)

    // Starburst flash
    const img = scene.add.image(x, y, TEX_PARRY).setBlendMode(Phaser.BlendModes.ADD).setScale(0.6).setAlpha(1)

    // Optional glow if postFX is available
    // @ts-ignore - postFX may not exist in typings
    if (img.postFX?.addGlow) img.postFX.addGlow(0xffff99, 4, 0)

    scene.tweens.add({
        targets: img,
        scale: { from: 0.6, to: 1.25 },
        alpha: { from: 1, to: 0 },
        duration: 200,
        ease: "Cubic.Out",
        onComplete: () => img.destroy(),
    })

    // Quick streaks shooting out around the impact normal
    // Use the incoming angle so most streaks bias away from the weapon.
    const baseDeg = incomingAngleRad !== undefined ? Phaser.Math.RadToDeg(incomingAngleRad) : 0
    const particles = scene.add.particles(x, y, TEX_STREAK, {
        lifespan: 140,
        speed: { min: 140, max: 220 },
        quantity: 10,
        // bias streaks to +/- 40° around the reflected direction (baseDeg + 180)
        angle: { min: baseDeg + 140, max: baseDeg + 220 },
        rotate: { onEmit: () => baseDeg + 180 + Phaser.Math.Between(-30, 30) },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 0,
        blendMode: "ADD",
        frequency: -1,
    })
    particles.explode(10, x, y)
    scene.time.delayedCall(180, () => particles.destroy())
}

// src/game/ui/DamageNumbers.ts
import Phaser from "phaser"
import { Game } from "../scenes/Game"

export type DamageType = "normal" | "block" | "heal" | "fire" | "cold" | "poison" | "true" | "lightning"

export type DamageTextOpts = {
    crit?: boolean
    type?: DamageType
    // overrides
    duration?: number
    float?: number
    baseScale?: number
}

type Layer = Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text
type Entry = Phaser.GameObjects.Container & { front: Layer; back: Layer }

const POOL = new WeakMap<Phaser.Scene, Entry[]>()

function hasBM(scene: Phaser.Scene) {
    // Phaser 3: cache.bitmapFont.exists(key)
    // @ts-ignore
    return scene.cache.bitmapFont?.exists("dmg") === true
}

function createLayer(scene: Game, bm: boolean): Layer {
    if (bm) {
        return scene.add.bitmapText(0, 0, "dmg", "", 28, Phaser.GameObjects.BitmapText.ALIGN_CENTER).setOrigin(0.5, 0.6)
    }
    // Fallback: Text
    return scene.add
        .text(0, 0, "", {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "18px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 6,
        })
        .setOrigin(0.5, 0.6)
        .setShadow(2, 2, "#000", 4, true, true)
}

function acquire(scene: Game): Entry {
    const pool = POOL.get(scene) ?? (POOL.set(scene, []), POOL.get(scene))
    const bm = hasBM(scene)
    const make = () => {
        const back = createLayer(scene, bm)
        const front = createLayer(scene, bm)

        // back acts as faux-outline (slightly larger + dark)
        back.setScale(1.1)
        if ("setTint" in back) (back as any).setTint(0x000000)
        else if ("setColor" in back) (back as any).setColor("#000000")

        const c = scene.add.container(0, 0, [back, front]) as Entry
        c.front = front
        c.back = back
        c.setDepth(10000).setVisible(false)
        return c
    }

    return pool?.pop() ?? make()
}

function release(scene: Game, e: Entry) {
    e.setVisible(false)
    const pool = POOL.get(scene)!
    pool.push(e)
}

function setText(layer: Layer, content: string) {
    if ("setText" in layer) (layer as any).setText(content)
}

function setTintOrColor(layer: Layer, tintHex: number, cssHex: string) {
    if ("setTint" in layer) (layer as any).setTint(tintHex)
    else if ("setColor" in layer) (layer as any).setColor(cssHex)
}

/** Diablo-like floating damage numbers */
export function showDamageText(scene: Game, x: number, y: number, value: number | string, opts: DamageTextOpts = {}) {
    const num = value
    const isCrit = !!opts.crit
    const kind: NonNullable<DamageTextOpts["type"]> = opts.type ?? (typeof num === "number" && num <= 0 ? "block" : "normal")

    const duration = opts.duration ?? (isCrit ? 2000 : 1500)
    const float = opts.float ?? (isCrit ? 64 : 32)
    const baseScale = opts.baseScale ?? (isCrit ? 1.25 : 1.0)

    const entry = acquire(scene)
    const { front, back } = entry

    // Content
    const text = String(value)
    setText(front, text)
    setText(back, text)

    // Tints per kind (front only; back stays dark)
    switch (kind) {
        // case "crit":
        //     setTintOrColor(front, 0xffd54f, "#ffd54f") // gold
        //     break
        case "block":
            setTintOrColor(front, 0xb0bec5, "#b0bec5") // gray/steel
            break
        case "heal":
            setTintOrColor(front, 0x7cfc00, "#7cfc00") // bright green
            break
        case "fire":
            setTintOrColor(front, 0xff6b6b, "#ff6b6b")
            break
        case "cold":
            setTintOrColor(front, 0x66d9ff, "#66d9ff")
            break
        case "lightning":
            setTintOrColor(front, 0x2525ff, "#2525ff")
            break
        case "poison":
            setTintOrColor(front, 0x9ccc65, "#9ccc65")
            break
        case "true":
            setTintOrColor(front, 0xce93d8, "#ce93d8")
            break
        default:
            setTintOrColor(front, 0xf2eee3, "#f2eee3") // warm white
    }

    // Reset transforms
    entry.setVisible(true)
    entry.setAlpha(1)
    entry.setScale(1)
    entry.setRotation(0)
    entry.setPosition(x + Phaser.Math.Between(-2, 2), y - 18)

    // Layer tweaks
    front.setBlendMode(isCrit ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.NORMAL)
    front.setScale(baseScale)
    back.setScale(baseScale * 1.1)

    // Motion: slight horizontal drift, upward float, and fade
    const driftX = Phaser.Math.Between(-20, 20)
    const startY = entry.y
    const endY = startY - float

    // Crit “pop” + micro wobble
    if (isCrit) {
        scene.tweens.add({
            targets: front,
            scale: baseScale * 1.25,
            duration: 90,
            yoyo: true,
            ease: "Back.Out",
        })
        scene.tweens.add({
            targets: entry,
            angle: { from: -12, to: 12 },
            duration: 90,
            ease: "Sine.InOut",
        })
    }

    scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration,
        ease: "Cubic.Out",
        onUpdate: (tw) => {
            const t = tw.getValue() || 1
            entry.x = x + driftX * t
            entry.y = Phaser.Math.Interpolation.SmoothStep(t, startY, endY)
            entry.setAlpha(1 - t)
        },
        onComplete: () => release(scene, entry),
    })
}

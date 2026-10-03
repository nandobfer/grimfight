import { Boot } from "./scenes/Boot"
import { Game as MainGame } from "./scenes/Game"
import { AUTO, CANVAS, Game } from "phaser"
import { Preloader } from "./scenes/Preloader"

type ArcadeDebugBody = {
    debugShowBody?: boolean
    debugShowVelocity?: boolean
    debugBodyColor?: number
}

type ArcadeDebugObject = {
    body?: ArcadeDebugBody
}

function installSafeArcadeDebugAccessors() {
    if (!import.meta.env.DEV) return

    const marker = "__grimFightSafeArcadeDebugAccessors"
    const prototypes = [Phaser.Physics.Arcade.Sprite.prototype, Phaser.Physics.Arcade.Image.prototype] as unknown as Array<object & Record<string, unknown>>

    for (const prototype of prototypes) {
        if (prototype[marker]) continue
        prototype[marker] = true

        Object.defineProperties(prototype, {
            debugShowBody: {
                configurable: true,
                get(this: ArcadeDebugObject) {
                    return this.body?.debugShowBody ?? false
                },
                set(this: ArcadeDebugObject, value: boolean) {
                    if (this.body) this.body.debugShowBody = value
                },
            },
            debugShowVelocity: {
                configurable: true,
                get(this: ArcadeDebugObject) {
                    return this.body?.debugShowVelocity ?? false
                },
                set(this: ArcadeDebugObject, value: boolean) {
                    if (this.body) this.body.debugShowVelocity = value
                },
            },
            debugBodyColor: {
                configurable: true,
                get(this: ArcadeDebugObject) {
                    return this.body?.debugBodyColor ?? 0xff00ff
                },
                set(this: ArcadeDebugObject, value: number) {
                    if (this.body) this.body.debugBodyColor = value
                },
            },
        })
    }
}

installSafeArcadeDebugAccessors()

function isMobileDevice() {
    // Multiple signals: UA + pointer type + touch points
    const ua = navigator.userAgent || ""
    const uaMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua)
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
    // const touch = (navigator as any).maxTouchPoints > 1
    return uaMobile || coarse
}

const USE_CANVAS_ON_MOBILE = true // tweak if you want a flag

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: USE_CANVAS_ON_MOBILE && isMobileDevice() ? CANVAS : AUTO,
    antialias: true,
    width: 768,
    height: 768,
    parent: "game-container",
    // backgroundColor: '#028af8',
    scene: [Boot, Preloader, MainGame],
    physics: {
        default: "arcade",
    },
    input: {
        // activePointers: 3,
        touch: {
            capture: true, // Disable touch event capture
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { powerPreference: "high-performance", antialias: true },
    fps: { target: 60, smoothStep: true },
}

const StartGame = (parent: string) => {
    return new Game({ ...config, parent })
}

export default StartGame

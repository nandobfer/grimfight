import { Boot } from "./scenes/Boot"
import { Game as MainGame } from "./scenes/Game"
import { AUTO, CANVAS, Game } from "phaser"
import { Preloader } from "./scenes/Preloader"

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
    type: USE_CANVAS_ON_MOBILE && isMobileDevice() ? Phaser.CANVAS : AUTO,
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

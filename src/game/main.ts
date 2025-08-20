import { Boot } from "./scenes/Boot"
import { Game as MainGame } from "./scenes/Game"
import { AUTO, Game } from "phaser"
import { Preloader } from "./scenes/Preloader"

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
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
}

const StartGame = (parent: string) => {
    return new Game({ ...config, parent })
}

export default StartGame

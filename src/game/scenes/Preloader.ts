import { Scene } from "phaser"
import { EventBus } from "../tools/EventBus"

export class Preloader extends Scene {
    constructor() {
        super("Preloader")
    }

    init() {
        this.load.on("progress", (progress: number) => {
            EventBus.emit("load-progress", progress)
        })

        this.load.on("complete", () => {
            EventBus.emit("load-complete")
        })
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath("assets")

        this.load.image("arena", "dark_arena_2.png")

        this.loadCharacterSpritesheets()
        this.loadParticles()
    }

    create() {
        this.scene.start("Game")
    }

    loadCharacterSpritesheets() {
        const available_sheets = ["rogue", "knight", "archer", "mage"]

        for (const character_sheet of available_sheets) {
            this.load.spritesheet(character_sheet, `spritesheets/characters/${character_sheet}.png`, {
                frameWidth: 64,
                frameHeight: 64,
            })
        }
    }

    loadParticles() {
        this.load.image("blood", "particles/blood.png")
        this.load.image("arrow", "particles/arrow.webp")

        for (let i = 0; i <= 52; i++) {
            this.load.image(`fire${i}`, `particles/fx1/flame4/png/${i.toString().padStart(2, "0")}.png`)
        }

        for (let i = 0; i <= 40; i++) {
            this.load.image(`fireball${i}`, `particles/fx1/flame10/png/${i.toString().padStart(2, "0")}.png`)
        }

        for (let i = 0; i <= 33; i++) {
            this.load.image(`firehit${i}`, `particles/fx1/flame8/png/png_${i.toString().padStart(2, "0")}.png`)
        }

        this.textures.exists("parry") ||
            (() => {
                const g = this.add.graphics()
                g.fillStyle(0xffff00, 1)
                g.fillRect(0, 0, 50, 16)
                g.generateTexture("parry", 50, 16)
                g.destroy()
            })()
    }
}

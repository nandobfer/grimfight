import { Scene } from "phaser"

export class Preloader extends Scene {
    constructor() {
        super("Preloader")
    }

    init() {
        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 800, 32).setStrokeStyle(1, 0xffffff)

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff)

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on("progress", (progress: number) => {
            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + 800 * progress
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
        const available_sheets = ["rogue", "knight", "archer"]

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

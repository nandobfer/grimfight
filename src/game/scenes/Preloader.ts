import { Scene } from "phaser"
import { EventBus } from "../tools/EventBus"

const available_classes = ["rogue", "knight", "archer", "mage"]
const available_monsters = ["skeleton", "armored_skeleton", "zombie", "demonic"]

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

        this.loadSpritesheets(available_classes, "characters")
        this.loadSpritesheets(available_monsters, "monsters")
        this.loadRagnarokSprites()
        this.loadParticles()
    }

    create() {
        this.scene.start("Game")
    }

    loadSpritesheets(sheets: string[], dir: string) {
        for (const sheet of sheets) {
            this.load.spritesheet(sheet, `spritesheets/${dir}/${sheet}.png`, {
                frameWidth: 64,
            })
        }
    }

    loadRagnarokSprites() {
        const path = (name: string) => "spritesheets/ragnarok/" + name + ".png"
        // this.load.spritesheet("aqua_elemental.idle", path("aqua_elemental")), { frameWidth: 69, frameHeight: 100, startFrame: 1, endFrame: 12 }
        // this.load.spritesheet("dracula.idle", path("dracula")), { frameWidth: 80, frameHeight: 155, startFrame: 1, endFrame: 11 }
        this.load.spritesheet("evil_fanatic", path("evil_fanatic"), { frameWidth: 248, frameHeight: 218 })
    }

    loadHealFx() {
        this.load.spritesheet("heal1", "particles/heal.png", { frameWidth: 192, startFrame: 1, endFrame: 7 })
        this.load.spritesheet("heal2", "particles/heal.png", { frameWidth: 192, startFrame: 8, endFrame: 11 })
        this.load.spritesheet("heal3", "particles/heal.png", { frameWidth: 192, startFrame: 12, endFrame: 18 })
        this.load.spritesheet("heal4", "particles/heal.png", { frameWidth: 192, startFrame: 19, endFrame: 30 })
    }

    loadParticles() {
        this.load.image("blood", "particles/blood.png")
        this.load.image("arrow", "particles/arrow.webp")
        this.load.spritesheet("explosion", "particles/explosion.png", { frameWidth: 110.6, frameHeight: 104, startFrame: 1, endFrame: 10 })
        this.loadHealFx()

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

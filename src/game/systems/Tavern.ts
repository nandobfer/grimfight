import { Bench } from "../creature/character/Bench"
import { Character, CharacterDto } from "../creature/character/Character"
import { Game } from "../scenes/Game"
import { EventBus } from "../tools/EventBus"
import { Item } from "./Items/Item"

export class Tavern extends Phaser.GameObjects.Image {
    declare scene: Game
    private text: Phaser.GameObjects.Text
    glowFx: Phaser.FX.Glow
    bench: Bench


    constructor(scene: Game) {
        const x = scene.background.x - scene.background.width / 3.7
        const y = scene.background.y + scene.background.height / 5
        super(scene, x, y, "shopkeeper")
        this.scene = scene
        this.setPipeline("Light2D")
        scene.add.existing(this)
        this.setScale(0.2)
        this.glowFx = this.postFX.addGlow(0xff6404, 0)
        this.bench = this.scene.playerTeam.bench


        this.text = this.scene.add
            .text(this.x, this.y - 80, "", {
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "16px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setVisible(true)
            .setShadow(2, 2, "#000", 4, true, true)
            .setPipeline("Light2D")

        this.hideStoreLabel()
        this.handleMouseEvents()
    }

    handleMouseEvents(): void {
        this.setInteractive({ useHandCursor: true, dropZone: true })

        const onBench = (character: Character) => {
            const dto = character.getDto()
            character.onBenchDrop()
            this.bench.add(dto)
        }

        EventBus.on("bench-character-tavern", onBench)

        this.on("pointerover", () => {
            this.onHoverGlow()
        })

        this.on("pointerout", () => {
            this.onHoverGlow(false)
        })

        this.on("pointerup", () => {
            console.log("oi")
            EventBus.emit("toggle-bench")
        })
        this.once("destroy", () => {
            EventBus.off("bench-character-tavern", onBench)
            this.removeAllListeners()
        })
    }

    private animateGlow(targetStrength: number) {
        if (!this.glowFx) return

        this.scene.tweens.add({
            targets: this.glowFx,
            outerStrength: targetStrength,
            duration: 250, // Animation duration (ms)
            ease: "Sine.easeOut", // Smooth easing
        })
    }

    onHoverGlow(active = true) {
        this.animateGlow(active ? 5 : 0.5)
    }

    onCharacterDragGlow(active = true) {
        this.animateGlow(active ? 2 : 0.5)
    }

    renderStoreLabel() {
        this.text.setText(`DROP HERE TO STORE`)
        this.text.setVisible(true)
    }

    hideStoreLabel() {
        this.text.setText(`TAVERN`)
    }



}

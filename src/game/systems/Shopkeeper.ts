import { Character } from "../creature/character/Character"
import { CharacterStore } from "../creature/character/CharacterStore"
import { Game } from "../scenes/Game"
import { EventBus } from "../tools/EventBus"

export class Shopkeeper extends Phaser.GameObjects.Image {
    declare scene: Game
    private costText: Phaser.GameObjects.Text
    private coinSprite: Phaser.GameObjects.Sprite
    glowFx: Phaser.FX.Glow
    store: CharacterStore

    constructor(scene: Game) {
        const x = scene.background.x + scene.background.width / 3.7
        const y = scene.background.y + scene.background.height / 5
        super(scene, x, y, "shopkeeper")
        this.scene = scene
        this.setPipeline("Light2D")
        scene.add.existing(this)
        this.setScale(0.2)
        this.glowFx = this.postFX.addGlow(0xf0f000, 0)
        this.store = this.scene.playerTeam.store

        this.costText = this.scene.add
            .text(this.x, this.y-80, "", {
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "16px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setVisible(true)
            .setShadow(2, 2, "#000", 4, true, true).setPipeline('Light2D')

        if (!this.scene.anims.exists("gold-coin")) {
            this.scene.anims.create({
                key: "gold-coin",
                frames: this.scene.anims.generateFrameNumbers("goldcoin"), // Use all frames
                frameRate: 10,
                repeat: -1,
            })
        }

        this.coinSprite = this.scene.add
            .sprite(this.x + 40, this.y - 80, "goldcoin")
            .setScale(0.5)
            .setVisible(false)
            .play("gold-coin")

        this.hideCharacterCost()
        this.handleMouseEvents()
    }

    handleMouseEvents(): void {
        this.setInteractive({ useHandCursor: true, dropZone: true })
        // this.scene.input.enableDebug(this);
        const onSell = (character: Character) => {
            this.store.sell(character)
        }
        EventBus.on("sell-character-shopkeeper", onSell)

        this.on("pointerover", () => {
            // if (this.scene.state === "idle") {
            this.onHoverGlow()
            // }
        })

        this.on("pointerout", () => {
            this.onHoverGlow(false)
        })

        this.on("pointerup", () => {
            EventBus.emit("toggle-store")
        })
        this.once("destroy", () => {
            EventBus.off("sell-character-shopkeeper", onSell)
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

    renderCharacterCost(character: Character) {
        const cost = this.scene.playerTeam.store.getCost(character.level)
        this.costText.setText(`SELL FOR  ${cost}`)
        this.costText.setVisible(true)

        // Position coin to the right of text
        const textWidth = this.costText.width
        this.coinSprite.setPosition(this.x + textWidth / 2 + 20, this.y - 80)
        this.coinSprite.setVisible(true)
    }

    hideCharacterCost() {
        this.costText.setText(`SHOP`)
        this.coinSprite.setVisible(false)
    }
}

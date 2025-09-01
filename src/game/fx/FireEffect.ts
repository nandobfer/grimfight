// src/game/FireEffect.ts
import Phaser from "phaser";

export class FireEffect extends Phaser.GameObjects.Sprite {
    private light: Phaser.GameObjects.Light;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "fire0"); // Use the first frame as default
        this.setOrigin(0.5, 1)
        
        
        if (!scene.anims.exists("fire-burning")) {
            const frames = [];
            
            for (let i = 0; i <= 52; i++) {
                frames.push({
                    key: `fire${i}`,
                    frame: undefined
                });
            }
            
            scene.anims.create({
                key: "fire-burning",
                frames: frames,
                frameRate: 30,
                repeat: -1
            });
        }
        
        this.play("fire-burning");
        
        scene.add.existing(this);
        this.setScale(0.15)
        
        this.addLightEffect();
    }
    
    private addLightEffect() {
        if (this.scene.lights) {
            this.light = this.scene.lights.addLight(this.x, this.y, 150, 0xff6600, 2)

            this.scene.tweens.add({
                targets: this.light,
                // radius: { from: 150, to: 300 },
                intensity: { from: 1, to: 4 },
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            })

            const handleUpdate = () => {
                if (this.active && this.light) {
                    this.light.setPosition(this.x, this.y)
                }
            }

            this.scene.events.on("update", handleUpdate)
            this.once("destroy", () => {
                this.scene.events.off("update", handleUpdate)
            })
        }
    }

}
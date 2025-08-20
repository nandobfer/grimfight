// src/game/FireEffect.ts
import Phaser from "phaser";

export class FireEffect extends Phaser.GameObjects.Sprite {
    private light: Phaser.GameObjects.Light;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "fire0"); // Use the first frame as default
        this.setOrigin(0.5, 1)
        
        
        // Create the fire animation if it doesn't exist
        if (!scene.anims.exists("fire-burning")) {
            const frames = [];
            
            // Assuming you have frames named fire0.png, fire1.png, fire2.png, etc.
            // Adjust the range based on how many frames you have
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
        
        // Play the animation
        this.play("fire-burning");
        
        // Add to scene
        scene.add.existing(this);
        
        // Add subtle flickering effect for more realism
        // scene.tweens.add({
        //     targets: this,
        //     scaleX: { from: 0.9, to: 1.1 },
        //     scaleY: { from: 0.9, to: 1.1 },
        //     y: { from: y - 5, to: y + 5 },
        //     duration: 500,
        //     yoyo: true,
        //     repeat: -1,
        //     ease: "Sine.easeInOut"
        // });
        this.setScale(0.15)
        
        // Optional: Add lighting effect if you want
        this.addLightEffect();
    }
    
    private addLightEffect() {
        // Create a light for the fire
        if (this.scene.lights) {
            this.scene.lights.enable();
            this.scene.lights.setAmbientColor(0x555555);
            
            this.light = this.scene.lights.addLight(this.x, this.y, 150, 0xff6600, 2);
            
            // Add flicker to the light
            this.scene.tweens.add({
                targets: this.light,
                // radius: { from: 150, to: 300 },
                intensity: { from: 1, to: 4 },
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });

            // ! random 
            // this.scene.tweens.add({
            //     targets: this.light,
            //     intensity: { from: 0.7, to: 1.3 },
            //     duration: Phaser.Math.FloatBetween(200, 500),
            //     yoyo: true,
            //     repeat: -1,
            //     ease: "Sine.easeInOut"
            // });
            // // Add flicker to the light
            // this.scene.tweens.add({
            //     targets: this.light,
            //     radius: { from: 100, to: 300 },
            //     duration: Phaser.Math.FloatBetween(1000, 5000),
            //     yoyo: true,
            //     repeat: -1,
            //     ease: "Sine.easeInOut"
            // });
            
            // Make light follow the fire
            this.scene.events.on("update", () => {
                this.light.setPosition(this.x, this.y);
            });
        }
    }

}
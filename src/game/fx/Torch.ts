// src/game/Torch.ts
import Phaser from "phaser";

export class Torch extends Phaser.GameObjects.Container {
    private base: Phaser.GameObjects.Sprite;
    private fire: Phaser.GameObjects.Sprite;
    private light: Phaser.GameObjects.PointLight;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        
        // Create torch base
        this.base = scene.add.sprite(0, 0, "torch-base");
        this.base.setOrigin(0.5, 1); // Anchor to bottom center
        this.add(this.base);
        
        // Create fire animation
        this.fire = scene.add.sprite(0, -this.base.displayHeight/2, "fire");
        this.fire.setOrigin(0.5, 1);
        this.add(this.fire);
        
        // Create fire animation if it doesn't exist
        if (!this.scene.anims.exists("fire-flicker")) {
            this.scene.anims.create({
                key: "fire-flicker",
                frames: this.scene.anims.generateFrameNumbers("fire", { start: 0, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
        }
        this.fire.play("fire-flicker");
        
        // Add point light for dynamic lighting
        this.light = scene.add.pointlight(0, -this.base.displayHeight/2 - 20, 0xffaa66, 60, 0.3, 0.1);
        this.light.setVisible(false); // Initially hidden if lighting not enabled
        this.add(this.light);
        
        // Add subtle flickering effect to light
        scene.tweens.add({
            targets: this.light,
            intensity: { from: 0.25, to: 0.35 },
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });
        
        scene.add.existing(this);
    }
}
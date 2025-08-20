// src/game/creature/RangedCreature.ts

import { Projectile } from "../objects/Projectile"
import { Game } from "../scenes/Game"
import { Creature } from "./Creature"

export class RangedCreature<T extends Projectile> extends Creature {
    attackRange = 3
    projectile: new (character: RangedCreature<T>) => T
    fireProjectileOnFrame = 0

    constructor(scene: Game, x: number, y: number, texture: string, projectile: new (character: RangedCreature<T>) => T, id: string, fireProjectileOnFrame: number) {
        super(scene, x, y, texture, id)
        this.projectile = projectile
        this.fireProjectileOnFrame = fireProjectileOnFrame
    }

    handleAnimationUpdate(_a: Phaser.Animations.Animation, _f: Phaser.Animations.AnimationFrame) {
        /* no-op for ranged */
    }

    private fireProjectile() {
        if (!this.target || !this.target.active) return
        const projectile = new this.projectile(this)
        projectile.fire()
    }

    startAttack() {
        if (this.isAttacking || !this.target?.active) {
            return
        }

        this.updateFacingDirection()
        this.isAttacking = true
        const animKey = `${this.name}-attacking-${this.facing}`
        const anim = this.anims.get(animKey)

        const onUpdate = (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
            if (animation.key !== animKey) return
            // Phaser frame indices are 1-based; we want "frame 9"
            if (frame.index === this.fireProjectileOnFrame) {
                this.fireProjectile()
            }
        }

        this.on("animationupdate", onUpdate)

        this.play({ key: animKey, frameRate: anim.frames.length * this.attackSpeed, repeat: 0 }, true)

        const cleanup = () => {
            this.off("animationupdate", onUpdate)
            this.isAttacking = false
        }
        this.once("animationcomplete", cleanup)
        this.once("animationstop", cleanup)
    }
}

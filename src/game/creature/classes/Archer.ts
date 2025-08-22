import { Arrow } from "../../objects/Arrow"
import { Game } from "../../scenes/Game"
import { Character } from "../character/Character"

export class Archer extends Character {
    baseAttackSpeed = 1
    baseApeed = 80
    baseAttackDamage = 30
    baseAttackRange = 4
    baseMaxHealth = 200

    constructor(scene: Game, id: string) {
        super(scene, "archer", id)
        this.attackAnimationImpactFrame = 9
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking1", 208, 13)
        this.extractAnimationsFromSpritesheet("attacking2", 208, 13)
    }

    // levelUp(): void {
    //     super.levelUp()

    //     this.baseAttackDamage += 10
    // }

    override landAttack() {
        const arrow = new Arrow(this)
        arrow.fire()
    }

    override castAbility(): void {
        this.casting = true
        this.attackDamage = this.attackDamage * 0.5

        let baseAngle = 0
        if (this.target) {
            baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)
        } else {
            // Default to facing direction if no target
            switch (this.facing) {
                case "right":
                    baseAngle = 0
                    break
                case "down":
                    baseAngle = Math.PI / 2
                    break
                case "left":
                    baseAngle = Math.PI
                    break
                case "up":
                    baseAngle = -Math.PI / 2
                    break
            }
        }

        // Create a wide spread of arrows (60 degrees total spread)
        const spreadAngle = Math.PI / 3 // 60 degrees in radians
        const angleStep = spreadAngle / 9 // Divide by 9 to get 10 arrows including edges

        for (let i = 0; i < 10; i++) {
            // Calculate angle for this arrow (-30 to +30 degrees from base angle)
            const arrowAngle = baseAngle - spreadAngle / 2 + angleStep * i

            const arrow = new Arrow(this)

            // Override the fire method temporarily to use our custom angle
            const originalFire = arrow.fire.bind(arrow)
            arrow.fire = () => {
                if (!this.active) return arrow

                arrow.setPosition(this.x, this.y)
                arrow.setActive(true).setVisible(true)
                arrow.setRotation(arrowAngle)

                arrow.scene.physics.velocityFromRotation(arrowAngle, arrow.speed, arrow.body.velocity)

                // Clean up if it travels too far
                arrow.scene.time.addEvent({
                    delay: 16,
                    loop: true,
                    callback: () => {
                        if (!arrow.active) {
                            arrow.destroy()
                        }
                    },
                })

                return arrow
            }

            arrow.fire()
        }

        this.attackDamage = this.attackDamage * 2
        // on animation complete, if any
        this.casting = false
    }
}

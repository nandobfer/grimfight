// import { Game } from "../../scenes/Game"
// import { RagnarokMonster } from "./RagnarokMonster"

// export class Ifrit extends RagnarokMonster {
//     baseMaxHealth = 3000
//     baseAttackDamage = 100
//     baseAttackSpeed = 1
//     baseMaxMana = 100
//     baseAttackRange = 3

//     constructor(scene: Game) {
//         super(scene, "ifrit", true)
//         this.preferredPosition = "back"
//         this.challengeRating = this.calculateCR()

//         this.setScale(0.4)
//         this.setSize(this.width / 2, this.height / 2)
//     }

//     override createAnimations() {
//         this.extractAnimationsFromSpritesheet("idle", 1, 6, true)
//         this.extractAnimationsFromSpritesheet("walking", 1, 6)
//         this.extractAnimationsFromSpritesheet("attacking1", 15, 6)
//         this.extractAnimationsFromSpritesheet("attacking2", 15, 6)
//     }

    

//     castAbility(): void {
//         this.casting = true

//         // const originalAttackSpeed = this.attackSpeed
//         // const originalScale = this.scale
//         const duration = 4000
//         const originalManaPerAttack = this.manaPerAttack
//         const originalManaPerSecond = this.manaPerSecond

//         this.manaPerAttack = 0
//         this.manaPerSecond = 0

//         this.scene.tweens.add({
//             targets: this,
//             scale: { from: this.scale, to: this.scale * 1.25 },
//             tint: { from: this.tint, to: 0xff0000 },
//             attackSpeed: { from: this.attackSpeed, to: this.attackSpeed * 2 },
//             yoyo: true,
//             repeat: 0,
//             duration: duration,
//             ease: "Sine.easeInOut",
//             onComplete: () => {
//                 this.manaPerAttack = originalManaPerAttack
//                 this.manaPerSecond = originalManaPerSecond
//             },
//         })

//         this.casting = false
//     }
// }

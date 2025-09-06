import { IceShard } from "../../objects/IceShard"
import { Game } from "../../scenes/Game"
import { RNG } from "../../tools/RNG"
import { Demonic } from "./Demonic"

export class IceDemonic extends Demonic {

    constructor(scene: Game) {
        super(scene)
        this.setTint(0x22ffff)
    }

    override getAttackingAnimation(): string {
        return "attacking"
    }

    override extractAttackingAnimation() {
        this.extractAnimationsFromSpritesheet("attacking", 208, 13)
    }

    override landAttack(target = this.target) {
        if (!target || !this.active) return

        const fireball = new IceShard(this)
        fireball.fire(target)
    }

    override castAbility(): void {
        this.casting = true

        const originalAttackDamage = this.attackDamage
        this.attackDamage = originalAttackDamage * 0.5
        const targets = 5
        const enemies = this.scene.playerTeam.getChildren(true, true)

        for (let i = 1; i <= targets; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                const target = RNG.pick(enemies)
                this.landAttack(target)
            })
        }

        this.attackDamage = originalAttackDamage
        this.casting = false
    }
}

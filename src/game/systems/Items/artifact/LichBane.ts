import { Creature } from "../../../creature/Creature"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class LichBane extends Item {
    key = "lichbane"
    name = "Lich Bane"
    descriptionLines = ["+40% AP", "Passive: When cast, your next basic attack deals an additional 200% AP as damage."]

    private readonly pendingAttackLandOriginals = new WeakMap<Creature, Creature["onAttackLand"]>()
    private readonly pendingAttackLandHandlers = new WeakMap<Creature, Creature["onAttackLand"]>()

    constructor(scene: Game) {
        super(scene, "item-lichbane")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("abilityPower", 40)

        const previousHandler = creature.eventHandlers[`lichbane_${this.id}`]
        if (previousHandler) {
            creature.off("cast", previousHandler)
        }

        const onCast = () => {
            if (this.pendingAttackLandOriginals.has(creature)) return

            const original = creature.onAttackLand
            const empoweredAttack: Creature["onAttackLand"] = (damagetype, target, attackDamage) => {
                this.restoreAttackLand(creature)

                const victim = target ?? creature.target
                let lichBaneDamage = 0

                if (victim?.active) {
                    const { value, crit } = creature.calculateDamage(creature.abilityPower * 2)
                    lichBaneDamage = victim.takeDamage(value, creature, "dark", crit, false, this.name)
                }

                const normalDamage = original.call(creature, damagetype, target, attackDamage)

                return normalDamage + lichBaneDamage
            }

            this.pendingAttackLandOriginals.set(creature, original)
            this.pendingAttackLandHandlers.set(creature, empoweredAttack)
            creature.onAttackLand = empoweredAttack
        }

        creature.eventHandlers[`lichbane_${this.id}`] = onCast

        creature.on("cast", onCast)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const handler = creature.eventHandlers[`lichbane_${this.id}`]
        if (handler) {
            creature.off("cast", handler)
            delete creature.eventHandlers[`lichbane_${this.id}`]
        }

        this.restoreAttackLand(creature)
    }

    private restoreAttackLand(creature: Creature): void {
        const original = this.pendingAttackLandOriginals.get(creature)
        if (!original) return

        const handler = this.pendingAttackLandHandlers.get(creature)
        if (handler && creature.onAttackLand === handler) {
            creature.onAttackLand = original
        }

        this.pendingAttackLandOriginals.delete(creature)
        this.pendingAttackLandHandlers.delete(creature)
    }
}

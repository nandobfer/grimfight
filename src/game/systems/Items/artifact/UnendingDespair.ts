import { Creature } from "../../../creature/Creature"
import { DarkSlashFx } from "../../../fx/DarkSlashFx"
import { Deathbolt } from "../../../objects/Projectile/Deathbolt"
import { Game } from "../../../scenes/Game"
import { Item } from "../Item"

export class UnendingDespair extends Item {
    key = "unendingdespair"
    name = "Unending Despair"
    descriptionLines = [
        "+30% max health",
        "+20% armor",
        "Passive: When a shield is broken, deal 150% of the total shield value as damage to nearby enemies.",
    ]

    shieldValue = 0

    constructor(scene: Game) {
        super(scene, "item-unendingdespair")
        this.smallImage()
    }

    override applyModifier(creature: Creature): void {
        creature.addStatPercent("maxHealth", 30)
        creature.addStatPercent("health", 30)
        creature.addStatValue("armor", 20)

        const shieldBrokenEvent = creature.eventHandlers[`unendingdespair_${this.id}_broken`]
        const gainShieldEvent = creature.eventHandlers[`unendingdespair_${this.id}_gain`]
        if (shieldBrokenEvent) {
            creature.off("shield-broken", shieldBrokenEvent)
        }
        if (gainShieldEvent) {
            creature.off("gain-shield", gainShieldEvent)
        }

        const onGainShield = (value: number) => {
            this.shieldValue += value
        }

        const onShieldBroken = () => {
            const targets = creature.getEnemiesInRange(64) || []
            for (const target of targets) {
                const { value, crit } = creature.calculateDamage(this.shieldValue * 1.5)
                target.takeDamage(value, creature, "dark", crit, false, this.name)
                new DarkSlashFx(target)
            }

            this.shieldValue = 0
        }

        creature.eventHandlers[`unendingdespair_${this.id}_broken`] = onShieldBroken
        creature.eventHandlers[`unendingdespair_${this.id}_gain`] = onGainShield

        creature.on("gain-shield", onGainShield)
        creature.on("shield-broken", onShieldBroken)
        creature.once("destroy", () => this.cleanup(creature))
    }

    override cleanup(creature: Creature): void {
        const brokenUnendingDespairHandler = creature.eventHandlers[`unendingdespair_${this.id}_broken`]
        if (brokenUnendingDespairHandler) {
            creature.off("shield-broken", brokenUnendingDespairHandler)
            delete creature.eventHandlers[`unendingdespair_${this.id}_broken`]
        }

        const gainUnendingDespairHandler = creature.eventHandlers[`unendingdespair_${this.id}_gain`]
        if (gainUnendingDespairHandler) {
            creature.off("gain-shield", gainUnendingDespairHandler)
            delete creature.eventHandlers[`unendingdespair_${this.id}_gain`]
        }

        this.shieldValue = 0
    }
}

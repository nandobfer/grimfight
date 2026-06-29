import type { Creature } from "../../creature/Creature"
import type { DamageType } from "../../ui/DamageNumbers"
import { calculateThresholdProtectedDamage } from "./ThresholdSurvivalFormulas"

type UntargetableEntry = {
    key: string
    threshold: number
    duration: number
    source: string
    triggered: boolean
}

type ThresholdCreatureState = {
    originalTakeDamage: Creature["takeDamage"]
    wrappedTakeDamage: Creature["takeDamage"]
    entries: UntargetableEntry[]
}

const thresholdUntargetableStates = new WeakMap<Creature, ThresholdCreatureState>()

export function applyThresholdUntargetable(creature: Creature, entry: Omit<UntargetableEntry, "triggered">): void {
    const state = getOrCreateThresholdState(creature)
    const previousEntry = state.entries.find((item) => item.key === entry.key)

    if (previousEntry) {
        previousEntry.threshold = entry.threshold
        previousEntry.duration = entry.duration
        previousEntry.source = entry.source
        return
    }

    state.entries.push({ ...entry, triggered: false })
}

export function cleanupThresholdUntargetable(creature: Creature, key: string): void {
    const state = thresholdUntargetableStates.get(creature)
    if (!state) return

    state.entries = state.entries.filter((entry) => entry.key !== key)

    if (state.entries.length > 0) return

    if (creature.takeDamage === state.wrappedTakeDamage) {
        creature.takeDamage = state.originalTakeDamage
    }
    thresholdUntargetableStates.delete(creature)
}

function getOrCreateThresholdState(creature: Creature): ThresholdCreatureState {
    const existingState = thresholdUntargetableStates.get(creature)
    if (existingState) return existingState

    const originalTakeDamage = creature.takeDamage
    const state: ThresholdCreatureState = {
        originalTakeDamage,
        wrappedTakeDamage: originalTakeDamage,
        entries: [],
    }

    const wrappedTakeDamage: Creature["takeDamage"] = (damage, attacker, type, crit = false, emit = true, source = "Attack") => {
        let protectedDamage = damage

        for (const entry of state.entries) {
            protectedDamage = calculateThresholdProtectedDamage({
                currentHealth: creature.health,
                maxHealth: creature.maxHealth,
                shield: creature.shield,
                armor: creature.armor,
                damage: protectedDamage,
                damageType: type,
                threshold: entry.threshold,
                alreadyTriggered: entry.triggered,
            })
        }

        const damageTaken = state.originalTakeDamage.call(creature, protectedDamage, attacker, type as DamageType, crit, emit, source)

        for (const entry of state.entries) {
            if (!entry.triggered && creature.active && creature.maxHealth > 0 && creature.health / creature.maxHealth <= entry.threshold) {
                triggerThresholdUntargetable(creature, entry)
            }
        }

        return damageTaken
    }

    state.wrappedTakeDamage = wrappedTakeDamage
    thresholdUntargetableStates.set(creature, state)
    creature.takeDamage = wrappedTakeDamage
    return state
}

function triggerThresholdUntargetable(creature: Creature, entry: UntargetableEntry): void {
    entry.triggered = true
    creature.removeFromEnemyTarget(entry.duration)
    creature.glowTemporarily(0xffffff, 2, Math.min(entry.duration, 600))

    const smokeParticles = creature.scene.add.particles(creature.x, creature.y, "blood", {
        lifespan: { min: 300, max: 600 },
        speed: { min: 20, max: 60 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        quantity: 8,
        tint: 0xffffff,
        angle: { min: 0, max: 360 },
        gravityY: -20,
    })

    smokeParticles.explode(15)
    creature.scene.time.delayedCall(600, () => smokeParticles.destroy())
}

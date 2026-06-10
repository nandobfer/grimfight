export type RokmoraConstellation = "archer" | "dragon" | "chalice"

export const ROKMORA_CONSTELLATIONS: RokmoraConstellation[] = ["archer", "dragon", "chalice"]
export const ROKMORA_CONSTELLATION_DURATION_MS = 3000
export const ROKMORA_CHALICE_TICK_MS = 1000
export const ROKMORA_ARCHER_STAR_DELAY_MS = 300

export function getNextRokmoraConstellation(current: RokmoraConstellation): RokmoraConstellation {
    const currentIndex = ROKMORA_CONSTELLATIONS.indexOf(current)
    return ROKMORA_CONSTELLATIONS[(currentIndex + 1) % ROKMORA_CONSTELLATIONS.length]
}

export function calculateRokmoraArcherDamage(maxHealth: number, abilityPower: number) {
    return maxHealth * 0.1 + abilityPower * 0.5
}

export function calculateRokmoraDragonShield(incomingDamage: number, armor: number) {
    return incomingDamage * (Math.max(0, armor) / 100)
}

export function calculateRokmoraChaliceHealingPool(maxHealth: number) {
    return maxHealth * 0.1
}

export function calculateRokmoraChaliceHealingPerAlly(maxHealth: number, woundedAllies: number) {
    if (woundedAllies <= 0) return 0

    return calculateRokmoraChaliceHealingPool(maxHealth) / woundedAllies
}

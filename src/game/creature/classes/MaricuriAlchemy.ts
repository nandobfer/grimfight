export interface MaricuriPoint {
    x: number
    y: number
}

export interface MaricuriBounds {
    left: number
    top: number
    right: number
    bottom: number
}

/** Basic-attack flask poison. */
export const MARICURI_FLASK_DOT_DURATION_MS = 2000
export const MARICURI_FLASK_DOT_TICK_RATE_MS = 500
export const MARICURI_FLASK_AP_RATIO_PER_TICK = 0.1

/** Big cast flask: travels, primes, detonates and leaves a poison cloud. */
export const MARICURI_BIG_FLASK_FLIGHT_MS = 420
export const MARICURI_BIG_FLASK_PRIME_MS = 720
export const MARICURI_BIG_FLASK_CLOUD_DURATION_MS = 3000
export const MARICURI_BIG_FLASK_CLOUD_RADIUS = 140
export const MARICURI_BIG_FLASK_CLOUD_TICK_RATE_MS = 1000
export const MARICURI_BIG_FLASK_DOT_DURATION_MS = 2000
export const MARICURI_BIG_FLASK_DOT_TICK_RATE_MS = 500
export const MARICURI_BIG_FLASK_AP_RATIO_PER_TICK = 0.25

/** Basic-attack flask: same throw/detonate mechanic as the cast, but smaller and weaker. */
export const MARICURI_SMALL_FLASK_RADIUS = 70
export const MARICURI_SMALL_FLASK_SCALE = 0.7

function safeNonNegative(value: number): number {
    return Number.isFinite(value) ? Math.max(0, value) : 0
}

function safeTicks(durationMs: number, tickRateMs: number): number {
    if (!Number.isFinite(durationMs) || !Number.isFinite(tickRateMs) || tickRateMs <= 0) return 0

    return Math.max(0, durationMs) / tickRateMs
}

export function calculateMaricuriFlaskTickDamage(abilityPower: number, multiplier = 1): number {
    return safeNonNegative(abilityPower) * MARICURI_FLASK_AP_RATIO_PER_TICK * safeNonNegative(multiplier)
}

export function calculateMaricuriFlaskTotalRawDamage(abilityPower: number, multiplier = 1): number {
    return calculateMaricuriFlaskTickDamage(abilityPower, multiplier) * safeTicks(MARICURI_FLASK_DOT_DURATION_MS, MARICURI_FLASK_DOT_TICK_RATE_MS)
}

export function calculateMaricuriCloudTickDamage(abilityPower: number, multiplier = 1): number {
    return safeNonNegative(abilityPower) * MARICURI_BIG_FLASK_AP_RATIO_PER_TICK * safeNonNegative(multiplier)
}

export function calculateMaricuriCloudDotTotalRawDamage(abilityPower: number, multiplier = 1): number {
    return calculateMaricuriCloudTickDamage(abilityPower, multiplier) * safeTicks(MARICURI_BIG_FLASK_DOT_DURATION_MS, MARICURI_BIG_FLASK_DOT_TICK_RATE_MS)
}

/** How many poison stacks from a single cloud tend to overlap on a target that stays inside. */
export function calculateMaricuriCloudAverageStacks(dotDurationMs: number, applicationIntervalMs: number): number {
    if (!Number.isFinite(dotDurationMs) || !Number.isFinite(applicationIntervalMs) || applicationIntervalMs <= 0) return 0

    return Math.max(0, dotDurationMs) / applicationIntervalMs
}

export function clampMaricuriPointToBounds(bounds: MaricuriBounds, point: MaricuriPoint): MaricuriPoint {
    return {
        x: clamp(point.x, bounds.left, bounds.right),
        y: clamp(point.y, bounds.top, bounds.bottom),
    }
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min

    return Math.max(min, Math.min(max, value))
}

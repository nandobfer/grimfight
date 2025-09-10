// src/game/balance/CR.ts
import { Game } from "../scenes/Game"
import { MonsterRegistry } from "../creature/monsters/MonsterRegistry"

export type StatsLike = {
    baseMaxHealth: number
    baseArmor: number
    baseAttackDamage: number
    baseAttackSpeed: number
    baseCritChance: number
    baseCritDamageMultiplier: number
    baseAttackRange: number
    baseSpeed: number
}

type CRParams = {
    refHit: number
    baseSpeed: number
    baseRange: number
    minFractionTaken: number
    rangeEhpBonus: number
    uptimeRangeBonus: number
    uptimeSpeedBonus: number
    scale: number
}

let CACHE: CRParams | null = null

export function invalidateCR() {
    CACHE = null
}

function expectedPerHit(s: StatsLike) {
    return s.baseAttackDamage * (1 + (s.baseCritChance / 100) * (s.baseCritDamageMultiplier - 1))
}

function rawCR(s: StatsLike, p: CRParams) {
    const fracTaken = Math.max(p.minFractionTaken, (Math.max(1, p.refHit) / p.refHit) * (1 - s.baseArmor / 100))
    let ehp = s.baseMaxHealth / fracTaken
    if (s.baseAttackRange > p.baseRange) {
        ehp *= 1 + p.rangeEhpBonus * (s.baseAttackRange - p.baseRange)
    }
    const dps = expectedPerHit(s) * s.baseAttackSpeed
    let uptime = 1 + p.uptimeRangeBonus * (s.baseAttackRange - p.baseRange) + p.uptimeSpeedBonus * (s.baseSpeed - p.baseSpeed)
    uptime = Math.max(0.7, Math.min(1.3, uptime))
    return Math.sqrt(ehp * (dps * uptime))
}

function buildParams(): CRParams {
    // ✅ no instantiation → no recursion
    const ref = MonsterRegistry.getBaseStats("skeleton")

    const params: CRParams = {
        refHit: expectedPerHit(ref),
        baseSpeed: ref.baseSpeed,
        baseRange: ref.baseAttackRange,
        minFractionTaken: 0.1,
        rangeEhpBonus: 0.05,
        uptimeRangeBonus: 0.07,
        uptimeSpeedBonus: 0.003,
        scale: 1,
    }

    const rawRef = rawCR(ref, params)
    params.scale = 1 / Math.max(1e-4, rawRef) // force Skeleton CR ≈ 1
    return params
}

export function getCR(_scene: Game): CRParams {
  if (!CACHE) CACHE = buildParams()
  return CACHE
}

export function computeCR(stats: StatsLike, scene: Game): number {
  const params = getCR(scene)
  const raw = rawCR(stats, params)
  return Math.max(0.1, raw * params.scale)
}

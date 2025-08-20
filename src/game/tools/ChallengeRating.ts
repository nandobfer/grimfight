// src/game/balance/CR.ts
import { Game } from "../scenes/Game"
import { MonsterRegistry } from "../creature/monsters/MonsterRegistry"

export type StatsLike = {
  maxHealth: number
  armor: number
  resistance: number
  attackDamage: number
  attackSpeed: number
  critChance: number
  critDamageMultiplier: number
  attackRange: number
  speed: number
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
  return s.attackDamage * (1 + (s.critChance / 100) * (s.critDamageMultiplier - 1))
}

function rawCR(s: StatsLike, p: CRParams) {
  const fracTaken = Math.max(
    p.minFractionTaken,
    (Math.max(1, p.refHit - s.armor) / p.refHit) * (1 - s.resistance / 100)
  )
  let ehp = s.maxHealth / fracTaken
  if (s.attackRange > p.baseRange) {
    ehp *= 1 + p.rangeEhpBonus * (s.attackRange - p.baseRange)
  }
  const dps = expectedPerHit(s) * s.attackSpeed
  let uptime =
    1 +
    p.uptimeRangeBonus * (s.attackRange - p.baseRange) +
    p.uptimeSpeedBonus * (s.speed - p.baseSpeed)
  uptime = Math.max(0.7, Math.min(1.3, uptime))
  return Math.sqrt(ehp * (dps * uptime))
}

function buildParams(): CRParams {
  // ✅ no instantiation → no recursion
  const ref = MonsterRegistry.getBaseStats("skeleton")

  const params: CRParams = {
    refHit: expectedPerHit(ref),
    baseSpeed: ref.speed,
    baseRange: ref.attackRange,
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

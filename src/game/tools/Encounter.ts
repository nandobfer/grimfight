// src/game/tools/Encounter.ts
import { Game } from "../scenes/Game"
import { RNG } from "./RNG"
import { Monster } from "../creature/monsters/Monster"
import { MonsterRegistry } from "../creature/monsters/MonsterRegistry"
import { ItemRegistry } from "../systems/Items/ItemRegistry"

export type Encounter = { monsters: Monster[]; isBoss: boolean }

type RegistryEntry = ReturnType<typeof MonsterRegistry.entries>[number] & {
    ctor: new (scene: Game) => Monster
}

let CR_CACHE = new WeakMap<RegistryEntry["ctor"], number>()
function ctorCR(scene: Game, ctor: RegistryEntry["ctor"]): number {
    const hit = CR_CACHE.get(ctor)
    if (hit != null) return hit
    const tmp = new ctor(scene)
    const cr = tmp.challengeRating
    tmp.destroy()
    CR_CACHE.set(ctor, cr)
    return cr
}
export function invalidateEncounterCRCache() {
    CR_CACHE = new WeakMap() as any
}

/** Scale to a target CR without boss visuals (mini-boss). */
function scaleToCR(mon: Monster, targetCR: number) {
    const base = Math.max(0.1, mon.calculateCR())
    const mult = Math.max(1, targetCR / base)
    mon.scaleStats(mult) // does not set boss flag / FX
    mon.scaleSize(mult / 2)
}

export function generateEncounter(scene: Game, floor: number, seedBase = 1337): Encounter {
    const rng = new RNG((floor * 1103515245 + seedBase) >>> 0)
    const targetCR = Math.max(1, floor)
    const isBoss = floor % 10 === 0

    if (isBoss) {
        const { ctor } = rng.pick(MonsterRegistry.entries())
        const boss = new ctor(scene)
        boss.makeBoss(targetCR)
        equipMonsterWithCRItems(boss, rng)
        return { monsters: [boss], isBoss: true }
    }

    // pool + minCR
    const pool = (MonsterRegistry.entries() as RegistryEntry[])
        .map((e) => ({
            ctor: e.ctor,
            cr: ctorCR(scene, e.ctor),
        }))
        .sort((a, b) => a.cr - b.cr)
    const minCR = pool[0]?.cr ?? 1

    // ---- choose enemy count in [2..6], respecting CR (never 1 except very early floors) ----
    const tol = 0.35
    const hardMax = 6
    // must satisfy: count * minCR <= targetCR + tol  (we can scale UP, not down)
    let maxByCR = Math.floor((targetCR + tol) / Math.max(1e-6, minCR))
    maxByCR = Math.max(1, Math.min(hardMax, maxByCR))

    let count: number
    if (maxByCR <= 1) {
        count = 1 // floor too low to place ≥2 minimum-CR units
    } else {
        // pick 2..maxByCR with a soft peak around the middle (triangular weights)
        const lo = 2,
            hi = maxByCR
        const n = hi - lo + 1
        const weights = Array.from({ length: n }, (_, i) => 1 + Math.min(i, n - 1 - i))
        const sumW = weights.reduce((a, b) => a + b, 0)
        let r = rng.next() * sumW
        let idx = 0
        for (; idx < n; idx++) {
            r -= weights[idx]
            if (r <= 0) break
        }
        count = lo + Math.min(idx, n - 1)
    }

    // ---- split targetCR into `count` shares, each ≥ minCR ----
    // guarantee feasibility: if minCR*count > targetCR, shrink count (shouldn’t happen with maxByCR but safe)
    while (count > 1 && minCR * count > targetCR + tol) count--

    const baseReserve = minCR * count
    const extra = Math.max(0, targetCR - baseReserve)
    // random positive weights
    const ws = Array.from({ length: count }, () => Math.max(1e-6, rng.next()))
    const wSum = ws.reduce((a, b) => a + b, 0)
    const shares = ws.map((w) => minCR + extra * (w / wSum))

    // ---- instantiate monsters for each share, scale up to share (mini-boss), adjust last to close gap ----
    const out: Monster[] = []
    let sum = 0

    for (let i = 0; i < count; i++) {
        const share = shares[i]
        // prefer the largest monster that fits the share
        const fit = pool.filter((p) => p.cr <= share)
        const pick = (fit.length ? fit : pool.slice(0, 1))[Math.max(0, fit.length - 1)] // largest ≤ share, else smallest
        const m = new pick.ctor(scene)

        const base = m.challengeRating
        if (base + 1e-3 < share) scaleToCR(m, share) // mini-boss up to share
        out.push(m)
        sum += m.challengeRating
    }

    // tighten to target by adjusting the last one (can make it a proper boss if needed)
    const last = out[out.length - 1]
    if (last) {
        const delta = targetCR - sum
        if (delta > tol) {
            scaleToCR(last, last.challengeRating + delta)
        } else if (delta < -tol && out.length > 1) {
            // if we overshot too much, drop the smallest and push that CR to the last
            out.sort((a, b) => a.challengeRating - b.challengeRating)
            const smallest = out.shift()!
            if (smallest) {
                smallest.destroy()
                const need = targetCR - out.reduce((acc, m) => acc + m.challengeRating, 0)
                const last2 = out[out.length - 1]
                if (last2 && need > 0) scaleToCR(last2, last2.challengeRating + need)
            }
        }
    }

    // cap at 6 defensively (should already be)
    while (out.length > hardMax) out.pop()?.destroy()

    console.log(CR_CACHE)

    for (const monster of out) {
        equipMonsterWithCRItems(monster, rng)
    }

    return { monsters: out, isBoss: false }
}

/**
 * Map CR → number of COMPLETED items, with soft ramp:
 * - CR 100+ ⇒ guaranteed 3 completed items
 * - Otherwise: each of 3 slots rolls with p = CR/100
 *   (so expected items = 3 * CR/100).
 *
 */
function completedItemsForCR(cr: number, rng: RNG): number {
    if (cr >= 100) return 3
    const p = Math.max(0, Math.min(1, cr / 100))
    let items = 0
    for (let i = 0; i < 3; i++) if (rng.next() < p) items++
    return items
}

/**
 * Equip items on monter based on it's CR.
 */
function equipMonsterWithCRItems(monster: Monster, rng: RNG) {
    const targetCompleted = completedItemsForCR(monster.challengeRating, rng)

    const exclude = new Set<string>(["thiefsgloves"]) // avoid recursion-y item on AI
    let attempts = 0
    const MAX_ATTEMPTS = 20

    while (monster.items.size < Math.min(3, targetCompleted) && attempts++ < MAX_ATTEMPTS) {
        const item = ItemRegistry.randomCompleted(monster.scene, [...exclude])
        // keep duplicates out
        if (exclude.has(item.key)) continue
        exclude.add(item.key)

        monster.equipItem(item, true)
    }
}

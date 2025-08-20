// src/game/tools/Encounter.ts
import { Game } from "../scenes/Game"
import { RNG } from "./RNG"
import { Monster } from "../creature/monsters/Monster"
import { MonsterRegistry } from "../creature/monsters/MonsterRegistry"

export type Encounter = { monsters: Monster[]; isBoss: boolean }

type RegistryEntry = ReturnType<typeof MonsterRegistry.entries>[number] & {
    ctor: new (scene: Game, x: number, y: number) => Monster
}

let CR_CACHE = new WeakMap<RegistryEntry["ctor"], number>()
function ctorCR(scene: Game, ctor: RegistryEntry["ctor"]): number {
    const hit = CR_CACHE.get(ctor)
    if (hit != null) return hit
    const tmp = new ctor(scene, -1_000_000, -1_000_000)
    const cr = tmp.challengeRating
    tmp.destroy()
    CR_CACHE.set(ctor, cr)
    return cr
}

export function invalidateEncounterCRCache() {
    CR_CACHE = new WeakMap() as any // or just clear by recreating the map
}

export function generateEncounter(scene: Game, stage: number, seedBase = 1337): Encounter {
    const rng = new RNG((stage * 1103515245 + seedBase) >>> 0)
    const targetCR = Math.max(1, stage)
    const isBoss = stage % 10 === 0

    if (isBoss) {
        const { ctor } = rng.pick(MonsterRegistry.entries())
        const boss = new ctor(scene, -1000, -1000)
        boss.makeBoss(targetCR)
        return { monsters: [boss], isBoss: true }
    }

    const tol = 0.35
    const maxSlots = Math.max(1, scene.grid.cols * 3)

    // Precompute pool with correct CRs (keyed by ctor)
    const rawPool = (MonsterRegistry.entries() as RegistryEntry[]).map((e) => ({
        ctor: e.ctor,
        cr: ctorCR(scene, e.ctor),
    }))

    rawPool.sort((a, b) => a.cr - b.cr)
    const minCR = rawPool[0]?.cr ?? 1

    const out: Monster[] = []
    let sum = 0

    while (sum < targetCR - tol && out.length < maxSlots) {
        const remaining = targetCR + tol - sum

        // Only candidates that actually fit the remaining budget
        const fit = rawPool.filter((p) => p.cr <= Math.max(remaining, minCR))
        if (fit.length === 0) break

        // Pick among the largest that still fit (top-K sampling)
        fit.sort((a, b) => a.cr - b.cr)
        const topK = fit.slice(-Math.min(3, fit.length))
        const picked = rng.pick(topK)

        // Instantiate and use the actual CR for accounting (extra safety)
        const monster = new picked.ctor(scene, -1000, -1000)
        const actual = monster.challengeRating

        // Final guard: if due to any discrepancy actual would overshoot, fallback to smallest that fits
        if (sum + actual > targetCR + tol && fit.length > 1) {
            monster.destroy()
            const smallest = fit[0]
            const m2 = new smallest.ctor(scene, -1000, -1000)
            const actual2 = m2.challengeRating
            if (sum + actual2 > targetCR + tol && out.length > 0) {
                // nothing reasonable fits; stop filling
                m2.destroy()
                break
            }
            out.push(m2)
            sum += actual2
            continue
        }

        out.push(monster)
        sum += actual

        console.debug("pick", monster.constructor.name, {
            poolCr: picked.cr,
            actualCr: actual,
            sumBefore: sum,
            sumAfter: sum + actual,
            remaining: targetCR + tol - sum,
        })
    }

    return { monsters: out, isBoss: false }
}

// src/game/tools/Encounter.ts
import { Game } from "../scenes/Game"
import { RNG } from "./RNG"
import { Monster } from "../characters/monsters/Monster"
import { MonsterRegistry } from "../characters/monsters/MonsterRegistry"

export type Encounter = { monsters: Monster[]; isBoss: boolean }

export function generateEncounter(scene: Game, stage: number, seedBase = 1337): Encounter {
    const rng = new RNG((stage * 1103515245 + seedBase) >>> 0)
    const targetCR = stage
    const isBoss = stage % 10 === 0

    // build enemy team
    const out: Monster[] = []

    if (isBoss) {
        // random boss base
        const { ctor } = rng.pick(MonsterRegistry.entries())
        const monster = new ctor(scene, -1000, -1000) // temp offscreen; positioned in reset()
        monster.makeBoss(targetCR)
        out.push(monster)
        return { monsters: out, isBoss: true }
    }

    // normal stage: random fill ~ targetCR (within tolerance), cap by grid capacity
    const maxSlots = Math.max(1, scene.grid.cols * 3)
    let sum = 0
    const tol = 0.35

    // pre-sample a few candidates to diversify
    const pool = MonsterRegistry.entries()

    while (sum < targetCR - tol && out.length < maxSlots) {
        const pick = rng.pick(pool)
        const monster = new pick.ctor(scene, -1000, -1000)
        const cr = monster.challengeRating
        // If overshooting too much, try another once; otherwise accept
        if (sum + cr > targetCR + tol && out.length > 0) {
            // one re-roll
            const alt = rng.pick(pool)
            const altMonster = new alt.ctor(scene, -1000, -1000)
            const cr2 = altMonster.challengeRating
            if (sum + cr2 <= targetCR + tol || cr2 <= cr) {
                out.push(altMonster)
                sum += cr2
                monster.destroy()
                continue
            }
            altMonster.destroy()
        }
        out.push(monster)
        sum += cr
    }

    console.log(out)

    return { monsters: out, isBoss: false }
}

// src/game/tools/RNG.ts
export class RNG {
    private s: number

    static chance() {
        return Phaser.Math.Between(1, 100)
    }

    static pick<T>(array: T[]) {
        return Phaser.Math.RND.pick(array)
    }

    static weightedPick<T>(array: T[]) {
        return Phaser.Math.RND.weightedPick(array)
    }

    static uuid() {
        return Phaser.Utils.String.UUID()
    }

    static characterLevel(highest: number) {
        if (highest <= 1) return 1

        const LOWEST_PROB = 0.05
        const MAX_WINDOW_SIZE = 4

        const rng = new RNG((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0)

        const remain = 1 - LOWEST_PROB

        const levels: number[] = []

        const first = Math.max(1, highest - MAX_WINDOW_SIZE)

        for (let availableLevel = first; availableLevel <= highest - 1; availableLevel++) {
            levels.push(availableLevel)
        }

        // Ensure every included lower level has prob ≥ HIGHEST_PROB (5%):
        // With linear weights w_i = 1..n, min prob = remain / (n(n+1)/2).
        // So enforce n ≤ floor((sqrt(1 + 8 * remain / HIGHEST_PROB) - 1)/2).
        const maxN = Math.floor((Math.sqrt(1 + 8 * (remain / LOWEST_PROB)) - 1) / 2) // = 5 for 0.95/0.05
        while (levels.length > maxN) levels.shift() // drop farthest (oldest) levels first

        // Linear weights: w_i = 1..n (closer to highest → larger weight)
        const n = levels.length
        const sumW = (n * (n + 1)) / 2
        let r = rng.next() * remain

        for (let i = 0; i < n; i++) {
            const w = i + 1 // 1..n
            const p = remain * (w / sumW)
            r -= p
            if (r <= 0) return levels[i]
        }
        return levels[0]
    }

    constructor(seed: number) {
        // mulberry32
        this.s = seed >>> 0
    }
    next(): number {
        let t = (this.s += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    int(max: number): number {
        return (this.next() * max) | 0
    }
    pick<T>(arr: T[]): T {
        return arr[this.int(arr.length)]
    }
}

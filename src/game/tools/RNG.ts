// src/game/tools/RNG.ts
export class RNG {
  private s: number
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
  int(max: number): number { return (this.next() * max) | 0 }
  pick<T>(arr: T[]): T { return arr[this.int(arr.length)] }
}

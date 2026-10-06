import type { GameRecord, GameRecordTrait } from "./GameRecord"

export type RecordMetric = "floor" | "count"
export interface RecordRanking {
    name: string
    floor: number
    count: number
}
export interface RecordDay {
    timestamp: number
    floor: number
    count: number
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

/** Read-only normalization: invalid entries are omitted without rewriting local saves. */
export function normalizeGameRecords(input: unknown): GameRecord[] {
    if (!Array.isArray(input)) return []
    return input.flatMap((value: unknown) => {
        if (!isObject(value) || typeof value.finishedAt !== "number" || value.finishedAt <= 0 ||
            !Number.isFinite(new Date(value.finishedAt).getTime()) || typeof value.floor !== "number" ||
            !Number.isInteger(value.floor) || value.floor < 1 || !Array.isArray(value.comp)) return []
        const comp = value.comp.flatMap((character: unknown, index: number) => {
            if (!isObject(character) || typeof character.name !== "string" || !character.name.trim()) return []
            return [{
                name: character.name,
                id: typeof character.id === "string" ? character.id : `legacy-${index}`,
                level: typeof character.level === "number" && Number.isFinite(character.level) ? character.level : 1,
                boardX: typeof character.boardX === "number" ? character.boardX : 0,
                boardY: typeof character.boardY === "number" ? character.boardY : 0,
                abilityDescription: typeof character.abilityDescription === "string" ? character.abilityDescription : "",
                baseCritDamageMultiplier: typeof character.baseCritDamageMultiplier === "number" ? character.baseCritDamageMultiplier : 1,
                items: Array.isArray(character.items) ? character.items.filter((item: unknown): item is string => typeof item === "string") : [],
            }]
        })
        const traits = Array.isArray(value.traits) && value.traits.every((trait: unknown) =>
            isObject(trait) && typeof trait.name === "string" && trait.name.length > 0 &&
            typeof trait.stage === "number" && Number.isInteger(trait.stage) && trait.stage > 0)
            ? value.traits as GameRecordTrait[] : undefined
        return [{ finishedAt: value.finishedAt, floor: value.floor, comp, traits,
            augments: Array.isArray(value.augments) ? value.augments as GameRecord["augments"] : [] }]
    })
}

export class GameRecordStatistics {
    readonly records: GameRecord[]
    readonly days: RecordDay[]
    readonly characters: RecordRanking[]
    readonly traits: RecordRanking[]
    readonly bestFloor: number
    readonly averageFloor: number
    readonly estimatedTraits: boolean

    constructor(input: unknown, resolveLegacyTraits: (names: readonly string[]) => GameRecordTrait[] = () => []) {
        this.records = normalizeGameRecords(input).sort((a, b) => b.finishedAt - a.finishedAt)
        const days = new Map<number, RecordDay>()
        const characters = new Map<string, RecordRanking>()
        const traits = new Map<string, RecordRanking>()
        let totalFloor = 0
        let bestFloor = 0
        const add = (map: Map<string, RecordRanking>, name: string, floor: number) => {
            const entry = map.get(name) ?? { name, floor: 0, count: 0 }
            entry.count++
            entry.floor = Math.max(entry.floor, floor)
            map.set(name, entry)
        }
        for (const record of this.records) {
            totalFloor += record.floor
            bestFloor = Math.max(bestFloor, record.floor)
            const date = new Date(record.finishedAt)
            const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
            const day = days.get(timestamp) ?? { timestamp, count: 0, floor: 0 }
            day.count++
            day.floor = Math.max(day.floor, record.floor)
            days.set(timestamp, day)
            const names = [...new Set(record.comp.map((character) => character.name))]
            for (const name of names) add(characters, name, record.floor)
            const snapshot = record.traits ?? resolveLegacyTraits(names)
            for (const name of new Set(snapshot.map((trait) => trait.name))) add(traits, name, record.floor)
        }
        this.days = [...days.values()].sort((a, b) => a.timestamp - b.timestamp)
        this.characters = [...characters.values()]
        this.traits = [...traits.values()]
        this.bestFloor = bestFloor
        this.averageFloor = this.records.length ? totalFloor / this.records.length : 0
        this.estimatedTraits = this.records.some((record) => record.traits === undefined)
    }

    static rank(entries: readonly RecordRanking[], metric: RecordMetric): RecordRanking[] {
        const secondary = metric === "floor" ? "count" : "floor"
        return [...entries].sort((a, b) => b[metric] - a[metric] || b[secondary] - a[secondary] || a.name.localeCompare(b.name))
    }
}

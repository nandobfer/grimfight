import type { GameRecord, GameRecordTrait } from "./GameRecord"
import { TraitsRegistry } from "./Traits/TraitsRegistry"

export class GameRecordTraits {
    static fromComposition(names: readonly string[]): GameRecordTrait[] {
        const unique = new Set(names)
        return TraitsRegistry.entries().flatMap(({ name, entry }) => {
            const trait = new entry.ctor(entry.comp)
            trait.activeComp = new Set(entry.comp.filter((character) => unique.has(character)))
            trait.getActiveStage()
            return trait.activeStage > 0 ? [{ name, stage: trait.activeStage }] : []
        })
    }

    static resolve(record: GameRecord): GameRecordTrait[] {
        return record.traits ?? this.fromComposition(record.comp.map((character) => character.name))
    }
}

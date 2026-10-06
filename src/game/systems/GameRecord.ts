import type { CharacterDto } from "../creature/character/Character"
import type { Augment } from "./Augment/Augment"

export interface GameRecordTrait {
    name: string
    stage: number
}

export class GameRecord {
    finishedAt: number
    floor: number
    comp: CharacterDto[]
    augments: Augment[]
    /** Missing on legacy saves; an empty snapshot means no traits were active. */
    traits?: GameRecordTrait[]
}

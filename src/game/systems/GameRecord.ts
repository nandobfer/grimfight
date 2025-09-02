import { CharacterDto } from "../creature/character/Character"
import { Augment } from "./Augment/Augment"

export class GameRecord {
    finishedAt: number
    floor: number
    comp: CharacterDto[]
    augments: Augment[]
}
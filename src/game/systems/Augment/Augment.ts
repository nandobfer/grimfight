import { OverridableStringUnion } from "@mui/types"
import { Creature } from "../../creature/Creature"
import { CreatureGroup } from "../../creature/CreatureGroup"
import { TokenizedDescription, TokenizedValue } from "../../tools/TokenizedText"
import { ChipPropsColorOverrides } from "@mui/material"

export class Augment {
    name: string
    description: string
    chosenFloor = 0
    values: TokenizedValue = { boost: 0 }
    descriptionValues: TokenizedDescription = { boost: { color: "", value: "" } }
    color?: OverridableStringUnion<"default" | "primary" | "secondary" | "error" | "info" | "success" | "warning", ChipPropsColorOverrides>

    constructor(name: string, description?: string) {
        this.name = name
        this.description = description || ""
    }

    // each augment must override
    applyModifier(creature: Creature) {}

    // each augment must override
    onPick(team: CreatureGroup) {}
}

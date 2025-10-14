import React, { useMemo } from "react"
import { Box, Button, Chip } from "@mui/material"
import { CharacterDto } from "../../game/creature/character/Character"
import { Tavern } from "../../game/systems/Tavern"
import { CharacterStore } from "../../game/creature/character/CharacterStore"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"

interface CharacterUnitProps {
    character: CharacterDto
    tavern: Tavern
    store: CharacterStore
    summonedCharactersLength: number
}

export const CharacterUnit: React.FC<CharacterUnitProps> = (props) => {
    const levelColor = useMemo(() => convertColorToString(colorFromLevel(props.character.level)), [props.character.level])

    return (
        <Box sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Chip label={`Lv ${props.character.level}`} sx={{ bgcolor: levelColor, color: "background.default", fontWeight: "bold" }} size="small" />

            <Box>
                <Button size="small" color="warning" onClick={() => props.tavern.bench.sell(props.character.id)}>
                    Sell: {props.store.getCost(props.character.level)}g
                </Button>
                <Button
                    size="small"
                    disabled={props.summonedCharactersLength >= props.tavern.scene.max_characters_in_board}
                    onClick={() => props.tavern.bench.summon(props.character.id)}
                >
                    Summon
                </Button>
            </Box>
        </Box>
    )
}

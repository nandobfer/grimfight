import React, { useMemo, useState } from "react"
import { Box, Paper, Typography } from "@mui/material"
import { CharacterSheet } from "./CharacterSheet"
import { CreatureGroup } from "../../game/creature/CreatureGroup"

interface CharactersRowProps {
    charactersGroup: CreatureGroup
}

export const CharactersRow: React.FC<CharactersRowProps> = (props) => {
    const characters = useMemo(() => props.charactersGroup.getChildren(), [props.charactersGroup])

    return (
        <Box
            sx={{
                flexDirection: "column",
                padding: 1,
                pointerEvents: "auto",
                height: "min-content",
                maxHeight: 1,
                overflowY: "auto",
            }}
        >
            {characters.map((char) => (
                <CharacterSheet character={char} key={char.id} />
            ))}
        </Box>
    )
}

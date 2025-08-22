import React, { useEffect, useMemo, useState } from "react"
import { Box, Paper, Typography } from "@mui/material"
import { CharacterSheet } from "./CharacterSheet"
import { Character } from "../../game/creature/character/Character"
import { EventBus } from "../../game/tools/EventBus"
import { CharacterGroup } from "../../game/creature/character/CharacterGroup"

interface CharactersRowProps {
    charactersGroup: CharacterGroup
}

export const CharactersRow: React.FC<CharactersRowProps> = (props) => {
    const [characters, setCharacters] = useState(props.charactersGroup.getChildren())

    useEffect(() => {
        const handler = (characters: Character[]) => {
            setCharacters([...characters])
        }
        EventBus.on("characters-change", handler)

        return () => {
            EventBus.off("characters-change", handler)
        }
    }, [])

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
                <CharacterSheet character={char} key={char.id} store={props.charactersGroup.store} />
            ))}
        </Box>
    )
}

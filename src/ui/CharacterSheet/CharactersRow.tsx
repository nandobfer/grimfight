import React, { useEffect, useMemo, useState } from "react"
import { Box, Chip, Paper, Tooltip, Typography } from "@mui/material"
import { CharacterSheet } from "./CharacterSheet"
import { Character } from "../../game/creature/character/Character"
import { EventBus } from "../../game/tools/EventBus"
import { CharacterGroup } from "../../game/creature/character/CharacterGroup"
import { max_characters_in_board } from "../../game/scenes/Game"
import { Augment } from "../../game/systems/Augment/Augment"

interface CharactersRowProps {
    charactersGroup: CharacterGroup
}

export const CharactersRow: React.FC<CharactersRowProps> = (props) => {
    const [characters, setCharacters] = useState(props.charactersGroup.getChildren())
    const [augments, setAugments] = useState(Array.from(props.charactersGroup.augments.values()))

    useEffect(() => {
        const charactersHandler = (characters: Character[]) => {
            setCharacters([...characters])
        }

        const augmentsHandler = (augment: Augment) => {
            setAugments((augments) => [...augments, augment])
        }
        EventBus.on("characters-change", charactersHandler)
        EventBus.on("augments-add", augmentsHandler)

        return () => {
            EventBus.off("characters-change", charactersHandler)
            EventBus.off("augments-add", augmentsHandler)
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
                width: 200,
            }}
        >
            {augments.length > 0 && (
                <Box sx={{ gap: 1, flexWrap: "wrap", maxHeight: 70, overflowY: "auto" }}>
                    <Typography variant="subtitle2">Aprimoramentos</Typography>
                    {augments.map((augment, index) => (
                        <Tooltip title={augment.description} key={augment.name + index.toString()}>
                            <Chip label={augment.name} size="small" onClick={() => null} color="warning" />
                        </Tooltip>
                    ))}
                </Box>
            )}

            <Typography sx={{ fontWeight: "bold", marginBottom: 1, marginTop: 1 }}>
                {characters.length} / {max_characters_in_board}
            </Typography>
            {characters.map((char) => (
                <CharacterSheet character={char} key={char.id} store={props.charactersGroup.store} />
            ))}
        </Box>
    )
}

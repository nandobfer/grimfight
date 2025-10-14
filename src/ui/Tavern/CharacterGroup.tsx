import React, { useMemo, useState } from "react"
import { Box, Chip, Collapse, IconButton, MenuItem } from "@mui/material"
import { CharacterDto } from "../../game/creature/character/Character"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { ExpandMore } from "@mui/icons-material"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { CharacterStore } from "../../game/creature/character/CharacterStore"
import { Tavern } from "../../game/systems/Tavern"
import { CharacterUnit } from "./CharacterUnit"

interface CharacterGroupProps {
    name: string
    characters: CharacterDto[]
    tavern: Tavern
    store: CharacterStore
    summonedCharactersLength: number
}

export const CharacterGroup: React.FC<CharacterGroupProps> = (props) => {
    const [expanded, setExpanded] = useState(false)

    const higherCharacter = props.characters.reduce((prev, current) => (prev.level > current.level ? prev : current))
    const levelColor = useMemo(() => convertColorToString(colorFromLevel(higherCharacter.level)), [higherCharacter.level])

    const handleToggle = () => {
        setExpanded((prev) => !prev)
    }

    return (
        <Box sx={{ flexDirection: "column" }}>
            <MenuItem sx={{ whiteSpace: "normal", gap: 1, paddingRight: 0 }} onClick={handleToggle}>
                <CharacterAvatar name={higherCharacter.name} size={30} />
                {props.name}

                <Box sx={{ marginLeft: "auto", alignItems: "center", gap: 1 }}>
                    <Chip
                        label={`Lv ${higherCharacter.level}`}
                        sx={{ bgcolor: levelColor, color: "background.default", fontWeight: "bold" }}
                        size="small"
                    />

                    <IconButton size="small" sx={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                        <ExpandMore />
                    </IconButton>
                </Box>
            </MenuItem>

            <Collapse in={expanded}>
                <Box sx={{ flexDirection: "column", paddingLeft: 4 }}>
                    {props.characters.sort((a, b) => b.level - a.level).map((character) => (
                        <CharacterUnit key={character.id} character={character} tavern={props.tavern} store={props.store} summonedCharactersLength={props.summonedCharactersLength} />
                    ))}
                </Box>
            </Collapse>
        </Box>
    )
}

import React, { useEffect, useMemo, useState } from "react"
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Typography } from "@mui/material"
import { Character } from "../../game/characters/Character"
import { ArrowDropDown, Expand } from "@mui/icons-material"
import { EventBus } from "../../game/EventBus"

interface CharacterSheetProps {
    character: Character
}

export interface SheetDataItem {
    title: string
    value: number | string
}

export const SheetData: React.FC<SheetDataItem> = (props) => {
    return (
        <Box sx={{ gap: 1 }}>
            <Typography fontWeight={"bold"} variant="caption">
                {props.title}:
            </Typography>
            <Typography variant="caption">{props.value}</Typography>
        </Box>
    )
}

export const CharacterSheet: React.FC<CharacterSheetProps> = (props) => {
    const [character, setCharacter] = useState(props.character)
    const attributes: SheetDataItem[] = useMemo(
        () => [
            { title: "Health", value: `${character.health} / ${character.maxHealth}` },
            { title: "Mana", value: `${Math.round(character.mana)} / ${character.maxMana}` },
            { title: "Mana Regen", value: `${character.manaPerSecond} /s` },
            { title: "Mana /hit", value: `${character.manaPerAttack}` },
            { title: "Attack Damage", value: character.attackDamage },
            { title: "Attack Speed", value: `${character.attackSpeed} /s` },
            { title: "Crit Chance", value: `${character.critChance} %` },
            { title: "Crit Damage Multiplier", value: `x ${character.critDamageMultiplier}` },
            { title: "Armor", value: character.armor },
            { title: "Resistance", value: character.resistance },
            { title: "Movement Speed", value: character.speed },
        ],
        [character]
    )

    useEffect(() => {
        const handler = (char: Character) => {
            setCharacter({ ...char } as Character) // Create a new object to force re-render
        }

        EventBus.on(`character-${character.id}-update`, handler)

        return () => {
            EventBus.off(`character-${character.id}-update`, handler)
        }
    }, [character.id])
    return (
        <Accordion sx={{ flexDirection: "column" }} slots={{ root: Box }}>
            <AccordionSummary sx={{ padding: 0 }}>
                <Button variant="outlined" fullWidth sx={{ justifyContent: "start" }}>
                    <Typography variant="subtitle2">{character.name}</Typography>
                </Button>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ flexDirection: "column" }}>
                    {attributes.map((data) => (
                        <SheetData key={data.title} title={data.title} value={data.value} />
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    )
}

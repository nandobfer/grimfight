import React, { useEffect, useMemo, useState } from "react"
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Button, LinearProgress, Typography, useMediaQuery } from "@mui/material"
import { Creature } from "../../game/creature/Creature"
import { EventBus } from "../../game/tools/EventBus"

interface CharacterSheetProps {
    character: Creature
}

export interface SheetDataItem {
    title: string
    value: number | string
}

export const SheetData: React.FC<SheetDataItem> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    return (
        <Box sx={{ gap: 1, alignItems: "center" }}>
            <Typography fontWeight={"bold"} variant="caption" fontSize={isMobile ? 8 : undefined}>
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
            { title: "Health", value: `${Math.round(character.health)} / ${character.maxHealth}` },
            { title: "Mana", value: `${Math.round(character.mana)} / ${character.maxMana}` },
            { title: "Mana Regen", value: `${character.manaPerSecond} /s` },
            { title: "Mana /hit", value: `${character.manaPerAttack}` },
            {
                title: "Attack Damage",
                value: `${Math.round(character.attackDamage * character.minDamageMultiplier)} - ${Math.round(
                    character.attackDamage * character.maxDamageMultiplier
                )}`,
            },
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
        const handler = (char: Creature) => {
            setCharacter({ ...char } as Creature) // Create a new object to force re-render
        }

        EventBus.on(`character-${character.id}-update`, handler)

        return () => {
            EventBus.off(`character-${character.id}-update`, handler)
        }
    }, [character.id])
    return (
        <Accordion sx={{ flexDirection: "column" }} slots={{ root: Box }}>
            <AccordionSummary sx={{ padding: 0, marginTop: -1.5, marginBottom: -0.5 }}>
                <Button variant="outlined" fullWidth sx={{ justifyContent: "start", padding: 1, gap: 1, alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 30, aspectRatio: 1, height: "auto" }} />
                    <Box sx={{ flexDirection: "column", flex: 1, alignItems: "start" }}>
                        <Typography variant="subtitle2">{character.name}</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(character.health / character.maxHealth) * 100}
                            sx={{ width: 1, height: 7 }}
                            color="success"
                        />
                    </Box>
                </Button>
            </AccordionSummary>
            <AccordionDetails sx={{ marginTop: -1.5, marginBottom: -0.5 }}>
                <Box sx={{ flexDirection: "column" }}>
                    {attributes.map((data) => (
                        <SheetData key={data.title} title={data.title} value={data.value} />
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    )
}

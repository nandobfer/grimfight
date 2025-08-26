import React, { useEffect, useMemo, useState } from "react"
import { Accordion, AccordionDetails, AccordionSummary, Badge, Box, Button, LinearProgress, Typography, useMediaQuery } from "@mui/material"
import { EventBus } from "../../game/tools/EventBus"
import { CharacterAvatar } from "./CharacterAvatar"
import { CharacterStore } from "../../game/creature/character/CharacterStore"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { AbilityTooltip } from "./AbilityTooltip"
import { Character } from "../../game/creature/character/Character"

interface CharacterSheetProps {
    character: Character
    store: CharacterStore
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
            { title: "Health", value: `${Math.round(character.health)} / ${Math.round(character.maxHealth)}` },
            { title: "Mana", value: `${Math.round(character.mana)} / ${character.maxMana}` },
            { title: "Mana Regen", value: `${character.manaPerSecond} /s` },
            { title: "Mana /hit", value: `${character.manaPerAttack}` },
            { title: "Ability Power", value: `${Math.round(character.abilityPower)}` },
            {
                title: "Attack Damage",
                value: `${Math.round(character.attackDamage * character.minDamageMultiplier)} - ${Math.round(
                    character.attackDamage * character.maxDamageMultiplier
                )}`,
            },
            { title: "Attack Speed", value: `${character.attackSpeed.toFixed(2)} /s` },
            { title: "Attack Range", value: `${character.attackRange}` },

            { title: "Crit Chance", value: `${character.critChance} %` },
            { title: "Crit Damage Multiplier", value: `x ${character.critDamageMultiplier}` },
            { title: "Life Steal", value: `${Math.round(character.lifesteal)} %` },
            { title: "Armor", value: Math.round(character.armor) },
            { title: "Resistance", value: Math.round(character.resistance) },
            { title: "Movement Speed", value: Math.round(character.speed) },
        ],
        [character]
    )

    const characterHealthPercent = useMemo(() => (character.health / character.maxHealth) * 100, [character.health, character.maxHealth])
    const levelColor = useMemo(() => convertColorToString(colorFromLevel(character.level)), [character.level])

    const sell = () => {
        props.store.sell(character.id)
    }

    useEffect(() => {
        setCharacter(character)
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
            <AccordionSummary sx={{ padding: 0, marginTop: -1.5, marginBottom: -0.5 }}>
                <AbilityTooltip description={character.abilityDescription}>
                    <Button variant="outlined" fullWidth sx={{ justifyContent: "start", padding: 1, gap: 1, alignItems: "center" }}>
                        <Badge
                            badgeContent={`${character.level}`}
                            slotProps={{ badge: { sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold" } } }}
                        >
                            <CharacterAvatar name={character.name} size={30} />
                        </Badge>
                        <Box sx={{ flexDirection: "column", flex: 1, alignItems: "start" }}>
                            <Typography variant="subtitle2">{character.name}</Typography>
                            <LinearProgress
                                variant="determinate"
                                value={characterHealthPercent}
                                sx={{ width: 1, height: 7 }}
                                color={characterHealthPercent > 45 ? "success" : characterHealthPercent > 20 ? "warning" : "error"}
                            />
                        </Box>
                    </Button>
                </AbilityTooltip>
            </AccordionSummary>
            <AccordionDetails sx={{ marginTop: -1.5, marginBottom: -0.5 }}>
                <Box sx={{ flexDirection: "column" }}>
                    {attributes.map((data) => (
                        <SheetData key={data.title} title={data.title} value={data.value} />
                    ))}
                    <Button color="warning" onClick={sell}>
                        Sell: {props.store.getCost(character.level)} g
                    </Button>
                </Box>
            </AccordionDetails>
        </Accordion>
    )
}

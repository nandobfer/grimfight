import React, { useMemo } from "react"
import { Box, Button, MenuItem, Paper, Typography } from "@mui/material"
import { CharacterDto } from "../../game/characters/Character"
import { SheetData, SheetDataItem } from "../CharacterSheet/CharacterSheet"

interface NewCharacterContainerProps {
    character: CharacterDto
    onChoose: (character: CharacterDto) => void
}

export const NewCharacterContainer: React.FC<NewCharacterContainerProps> = (props) => {
    const character = props.character

    const attributes: SheetDataItem[] = useMemo(
        () => [
            { title: "Health", value: character.maxHealth },
            // { title: "Mana", value: character.maxMana },
            // { title: "Mana Regen", value: `${character.manaPerSecond} /s` },
            // { title: "Mana /hit", value: `${character.manaPerAttack}` },
            { title: "Attack Damage", value: character.attackDamage },
            { title: "Attack Speed", value: `${character.attackSpeed} /s` },
            { title: "Crit Chance", value: `${character.critChance} %` },
            // { title: "Crit Damage Multiplier", value: `x ${character.critDamageMultiplier}` },
            { title: "Armor", value: character.armor },
            { title: "Resistance", value: character.resistance },
            { title: "Movement Speed", value: character.speed },
        ],
        [character]
    )

    return (
        <Button sx={{ padding: 0, flexShrink: 0 }} variant="outlined" onClick={() => props.onChoose(character)}>
            <Paper sx={{ flexDirection: "column", gap: 1, padding: 1 }} elevation={5}>
                <Typography variant="body1" fontWeight={"bold"}>
                    {character.name}
                </Typography>
                {attributes.map((data) => (
                    <SheetData key={data.title} title={data.title} value={data.value} />
                ))}
            </Paper>
        </Button>
    )
}

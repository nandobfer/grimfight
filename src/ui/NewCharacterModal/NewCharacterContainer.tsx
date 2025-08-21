import React, { useMemo } from "react"
import { Avatar, Button, Paper, Typography } from "@mui/material"
import { SheetData, SheetDataItem } from "../CharacterSheet/CharacterSheet"
import { CharacterDto } from "../../game/creature/character/Character"

interface NewCharacterContainerProps {
    character: CharacterDto
    onChoose: (character: CharacterDto) => void
}

export const NewCharacterContainer: React.FC<NewCharacterContainerProps> = (props) => {
    const character = props.character

    const attributes: SheetDataItem[] = useMemo(
        () => [
            { title: "Health", value: character.baseMaxHealth },
            // { title: "Mana", value: character.maxMana },
            // { title: "Mana Regen", value: `${character.manaPerSecond} /s` },
            // { title: "Mana /hit", value: `${character.manaPerAttack}` },
            { title: "Attack Damage", value: character.baseAttackDamage },
            { title: "Attack Speed", value: `${character.baseAttackSpeed} /s` },
            { title: "Crit Chance", value: `${character.baseCritChance} %` },
            // { title: "Crit Damage Multiplier", value: `x ${character.critDamageMultiplier}` },
            { title: "Armor", value: character.baseArmor },
            { title: "Resistance", value: character.baseResistance },
            { title: "Movement Speed", value: character.baseSpeed },
        ],
        [character]
    )

    return (
        <Button sx={{ padding: 0, flexShrink: 0 }} variant="outlined" onClick={() => props.onChoose(character)}>
            <Paper sx={{ flexDirection: "column", gap: 1, padding: 1 }} elevation={5}>
                <Typography variant="body1" fontWeight={"bold"}>
                    {character.name}
                </Typography>
                <Avatar sx={{ width: 75, aspectRatio: 1, height: "auto", alignSelf: "center" }} />
                {attributes.map((data) => (
                    <SheetData key={data.title} title={data.title} value={data.value} />
                ))}
            </Paper>
        </Button>
    )
}

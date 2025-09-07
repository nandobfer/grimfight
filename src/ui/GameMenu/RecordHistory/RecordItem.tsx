import React, { useMemo } from "react"
import { Avatar, Badge, Box, Divider, Paper, Tooltip, Typography, useMediaQuery } from "@mui/material"
import { GameRecord } from "../../../game/systems/GameRecord"
import { CharacterAvatar } from "../../CharacterSheet/CharacterAvatar"
import { colorFromLevel, convertColorToString } from "../../../game/tools/RarityColors"
import { TraitsRegistry } from "../../../game/systems/Traits/TraitsRegistry"
import { TraitList } from "../../Traits/TraitList"
import { AbilityTooltip } from "../../CharacterSheet/AbilityTooltip"

interface RecordItemProps {
    record: GameRecord
}

export const RecordItem: React.FC<RecordItemProps> = (props) => {
    const isMobile = useMediaQuery("(orientation: portrait)")

    const traits = useMemo(() => {
        const compSet = new Set(props.record.comp.map((char) => char.name))
        const traits = TraitsRegistry.compTraits(Array.from(compSet))
        for (const trait of traits) {
            for (const char of compSet) {
                if (trait.comp.includes(char)) {
                    trait.activeComp.add(char)
                }
            }
            console.log(props.record)
            trait.getActiveStage()
        }

        return traits.filter((trait) => trait.activeStage > 0)
    }, [props.record.comp])

    return (
        <>
            <Box sx={{ gap: 1, alignItems: "center" }}>
                <Box sx={{ flexDirection: "column" }}>
                    <Typography variant="caption">{new Date(props.record.finishedAt || Date.now()).toLocaleDateString("pt-br")}</Typography>
                    <Tooltip title={"Andar alcançado"}>
                        <Box sx={{ gap: 1, alignItems: "center" }}>
                            <Avatar src={"/assets/darkest_skull.webp"} sx={{ margin: -1 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                {props.record.floor}
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>

                <Box sx={{ gap: 0.5 }}>
                    {props.record.comp.map((char) => (
                        <AbilityTooltip description={char.abilityDescription} placement="auto">
                            <Badge
                                key={char.id}
                                badgeContent={`${char.level}`}
                                slotProps={{
                                    badge: {
                                        sx: {
                                            bgcolor: convertColorToString(colorFromLevel(char.level)),
                                            color: "background.default",
                                            fontWeight: "bold",
                                            fontSize: isMobile ? 8 : undefined,
                                        },
                                    },
                                }}
                            >
                                <CharacterAvatar name={char.name} size={30} variant="square" />
                            </Badge>
                        </AbilityTooltip>
                    ))}
                </Box>

                <Box sx={{ marginLeft: 1 }}>
                    <TraitList traits={traits} row />
                </Box>
            </Box>
            <Divider sx={{ width: 1 }} />
        </>
    )
}

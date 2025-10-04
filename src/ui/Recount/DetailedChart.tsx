import React from "react"
import { Badge, Box, capitalize, Divider, Typography } from "@mui/material"
import { DamageMeter } from "../../game/tools/DamageChart"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { TftDamageBar } from "./RecountChart"

interface DetailedChartProps {
    meter: DamageMeter
    highest_damage: number
    levelColor: string
}

export const DetailedChart: React.FC<DetailedChartProps> = (props) => {
    const character = props.meter.character

    const details = Array.from(props.meter.details.values())
    const highestAbility = details.reduce((h, a) => (a.total > h ? a.total : h), 0) || 0

    return (
        <Box sx={{ flexDirection: "column", gap: 1 }}>
            <Box sx={{ alignItems: "center", gap: 1 }}>
                <Badge
                    badgeContent={`${character.level}`}
                    slotProps={{ badge: { sx: { bgcolor: props.levelColor, color: "background.default", fontWeight: "bold" } } }}
                >
                    <CharacterAvatar name={character.name} size={30} />
                </Badge>
                <Typography variant="subtitle2">{capitalize(character.name)}</Typography>
            </Box>

            {details
                .sort((a, b) => b.total - a.total)
                .map((ability) => (
                    <Box key={ability.name} sx={{ flexDirection: "column" }}>
                        <Typography variant="caption" fontSize={10} sx={{ textAlign: "left" }}>
                            {ability.name}
                        </Typography>
                        <Box sx={{ gap: 1, alignItems: "center", width: 1, whiteSpace: "normal" }}>
                            <Box sx={{ flex: 1 }}>
                                <TftDamageBar
                                    physical={ability.physical}
                                    magical={ability.magical}
                                    trueDmg={ability.true}
                                    highest={highestAbility}
                                    total={ability.total} // optional; keeps scaling consistent with your total
                                    // colors={{ physical: theme.palette.error.main, magical: theme.palette.info.main, trueDmg: theme.palette.secondary.main }}
                                />
                            </Box>

                            <Typography variant="caption" fontSize={10} sx={{ textAlign: "right" }}>
                                {Math.round(ability.total)}
                            </Typography>
                        </Box>

                        <Divider sx={{ mt: 1 }} />
                    </Box>
                ))}
        </Box>
    )
}

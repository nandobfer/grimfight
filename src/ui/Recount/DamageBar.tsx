import React, { useMemo } from 'react'
import { Box, LinearProgress, Typography } from "@mui/material"
import { DamageMeter } from '../../game/tools/DamageChart'
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"

interface DamageBarProps {
    meter: DamageMeter
    highest_damage: number
}

export const DamageBar: React.FC<DamageBarProps> = (props) => {
    const value = useMemo(() => (props.meter.damage / (props.highest_damage || 100)) * 100, [props.meter, props.highest_damage])

    return (
        <Box sx={{ gap: 1, alignItems: "center" }} color="primary.main">
            <CharacterAvatar name={props.meter.character.name} size={20} />
            <LinearProgress variant="determinate" sx={{ width: 1 }} value={value} color="primary" />
            <Typography variant="caption" fontSize={10}>
                {Math.round(props.meter.damage)}
            </Typography>
        </Box>
    )
}
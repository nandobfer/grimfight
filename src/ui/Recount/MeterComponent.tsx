import React, { useMemo } from "react"
import { Badge, Box, LinearProgress, Typography } from "@mui/material"
import { DamageMeter } from "../../game/tools/DamageChart"
import { CharacterAvatar } from "../CharacterSheet/CharacterAvatar"
import { colorFromLevel, convertColorToString } from "../../game/tools/RarityColors"
import { DamageBar } from "./DamageBar"

interface MeterComponentProps {
    meter: DamageMeter
    highest_damage: number
}

export const MeterComponent: React.FC<MeterComponentProps> = (props) => {
    const relativeTotal = useMemo(() => (props.meter.total / (props.highest_damage || 100)), [props.meter.total, props.highest_damage])
    const levelColor = useMemo(() => convertColorToString(colorFromLevel(props.meter.character.level)), [props.meter.character.level])

    return (
        <Box sx={{ gap: 1, alignItems: "center" }} color="primary.main">
            <Badge
                badgeContent={`${props.meter.character.level}`}
                variant="dot"
                slotProps={{ badge: { sx: { bgcolor: levelColor, color: "background.default", fontWeight: "bold" } } }}
            >
                <CharacterAvatar name={props.meter.character.name} size={20} />
            </Badge>
            <Box sx={{width: relativeTotal}}>
                <DamageBar total={props.meter.total} damage={props.meter.physical} type="physical" />
                <DamageBar total={props.meter.total} damage={props.meter.magical} type="magical" />
                <DamageBar total={props.meter.total} damage={props.meter.true} type="true" />
            </Box>
            <Typography variant="caption" fontSize={10}>
                {Math.round(props.meter.total)}
            </Typography>
        </Box>
    )
}

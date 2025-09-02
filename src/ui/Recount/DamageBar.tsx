import React, { useMemo } from "react"
import { Box, LinearProgress } from "@mui/material"
import { MeterType } from "../../game/tools/DamageChart"

interface DamageBarProps {
    damage: number
    type: MeterType
    total: number
}

export const DamageBar: React.FC<DamageBarProps> = (props) => {
    const value = useMemo(() => props.damage / props.total, [props.damage, props.total])

    return (
        <LinearProgress
            variant="determinate"
            sx={{ width: value }}
            value={100}
            color={props.type === "magical" ? "info" : props.type === "physical" ? "error" : "secondary"}
        />
    )
}

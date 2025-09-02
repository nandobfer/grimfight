import React, { useEffect, useMemo, useState } from "react"
import { Box, Paper } from "@mui/material"
import { DamageMeter } from "../../game/tools/DamageChart"
import { EventBus } from "../../game/tools/EventBus"
import { MeterComponent } from "./MeterComponent"

interface RecountProps {}

export const Recount: React.FC<RecountProps> = (props) => {
    const [damageChart, setDamageChart] = useState<DamageMeter[]>([])

    const highestDamage = useMemo(() => damageChart.reduce((highest, meter) => (highest >= meter.total ? highest : meter.total), 0), [damageChart])

    useEffect(() => {
        const handler = (damages: DamageMeter[]) => {
            setDamageChart([...damages])
        }
        EventBus.on("damage-chart", handler)
        EventBus.emit("request-damage-chart")

        return () => {
            EventBus.off("damage-chart", handler)
        }
    }, [])

    return (
        <Paper sx={{ flexDirection: "column", bgcolor: "#ffffff05", padding: 1, gap: 1, width: 150 }} elevation={1}>
            {damageChart
                .sort((a, b) => b.total - a.total)
                .map((meter) => (
                    <MeterComponent highest_damage={highestDamage} meter={meter} key={meter.character.id} />
                ))}
        </Paper>
    )
}

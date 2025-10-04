import React, { useEffect, useMemo, useState } from "react"
import { Paper, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material"
import { DamageMeter, HealingMeter } from "../../game/tools/DamageChart"
import { EventBus } from "../../game/tools/EventBus"
import { Add, Bolt } from "@mui/icons-material"
import { GroupChart } from "./DamageChart"

export const Recount: React.FC = () => {
    const [damageCharts, setDamageCharts] = useState<DamageMeter[]>([])
    const [healingCharts, setHealingCharts] = useState<HealingMeter[]>([])
    const [recountType, setRecountType] = useState<"damage" | "heal">("damage")

    const damageHandler = (damages: DamageMeter[]) => {
        setDamageCharts(damages)
    }

    const healingHandler = (heals: Map<string, HealingMeter>) => {
        setHealingCharts(Array.from(heals.values()))
    }

    useEffect(() => {
        EventBus.on("damage-chart", damageHandler)
        EventBus.on("healing-chart", healingHandler)
        EventBus.emit("request-damage-chart")
        return () => {
            EventBus.off("damage-chart", damageHandler)
            EventBus.off("healing-chart", healingHandler)
        }
    }, [])

    const highestDamage = useMemo(() => damageCharts.reduce((h, m) => (m.total > h ? m.total : h), 0), [damageCharts])
    const highestHealing = useMemo(() => healingCharts.reduce((h, m) => (m.total > h ? m.total : h), 0), [healingCharts])

    return (
        <Paper sx={{ display: "flex", flexDirection: "column", bgcolor: "#ffffff05", width: 150, pointerEvents: "auto" }} elevation={1}>
            <ToggleButtonGroup size="small" value={recountType} exclusive onChange={(_, v) => v && setRecountType(v)} sx={{ mb: 1 }}>
                <Tooltip title="Damage Chart" arrow placement="top">
                    <ToggleButton value="damage" sx={{ flex: 1 }}>
                        <Bolt fontSize="small" />
                    </ToggleButton>
                </Tooltip>
                <Tooltip title="Healing Chart" arrow placement="top">
                    <ToggleButton value="heal" sx={{ flex: 1 }}>
                        <Add fontSize="small" />
                    </ToggleButton>
                </Tooltip>
            </ToggleButtonGroup>

            {recountType === "damage" && <GroupChart charts={damageCharts} highestvalue={highestDamage} />}
            {recountType === "heal" && <GroupChart charts={healingCharts} highestvalue={highestHealing} />}
        </Paper>
    )
}

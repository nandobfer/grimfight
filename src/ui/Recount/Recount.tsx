import React, { useEffect, useMemo, useState } from "react"
import { Box, IconButton, Paper, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material"
import { DamageMeter, HealingMeter } from "../../game/tools/DamageChart"
import { EventBus } from "../../game/tools/EventBus"
import { Add, Assessment, Bolt, Close } from "@mui/icons-material"
import { GroupChart } from "./DamageChart"
import { Game } from "../../game/scenes/Game"

interface RecountProps {
    game: Game
}

export const Recount: React.FC<RecountProps> = (props) => {
    const [damageCharts, setDamageCharts] = useState<DamageMeter[]>([])
    const [healingCharts, setHealingCharts] = useState<HealingMeter[]>([])
    const [recountType, setRecountType] = useState<"damage" | "heal">("damage")
    const [expanded, setExpanded] = useState(false)

    const damageHandler = (damages: DamageMeter[]) => {
        setDamageCharts(damages)
    }

    const healingHandler = (heals: Map<string, HealingMeter>) => {
        setHealingCharts(Array.from(heals.values()))
    }

    useEffect(() => {
        EventBus.on("damage-chart", damageHandler)
        EventBus.on("healing-chart", healingHandler)
        setHealingCharts([])
        props.game.playerTeam.damageChart.reset()
        return () => {
            EventBus.off("damage-chart", damageHandler)
            EventBus.off("healing-chart", healingHandler)
        }
    }, [props.game])

    const highestDamage = useMemo(() => damageCharts.reduce((h, m) => (m.total > h ? m.total : h), 0), [damageCharts])
    const highestHealing = useMemo(() => healingCharts.reduce((h, m) => (m.total > h ? m.total : h), 0), [healingCharts])

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", pointerEvents: "auto" }}>
            <Tooltip title={expanded ? "Recolher gráfico" : "Expandir gráfico"} placement="auto">
                <IconButton color="inherit" size="small" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Collapse damage chart" : "Expand damage chart"}>
                    {expanded ? <Close fontSize="small" /> : <Assessment fontSize="small" />}
                </IconButton>
            </Tooltip>

            {expanded && (
                <Paper sx={{ display: "flex", flexDirection: "column", bgcolor: "#ffffff05", width: { xs: 132, sm: 150 } }} elevation={1}>
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
            )}
        </Box>
    )
}

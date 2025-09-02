import React, { useEffect, useMemo, useRef, useState } from "react"
import { Paper } from "@mui/material"
import { DamageMeter } from "../../game/tools/DamageChart"
import { EventBus } from "../../game/tools/EventBus"
import { MeterComponent } from "./MeterComponent"

const makeSnap = (meters: DamageMeter[]): DamageMeter[] =>
    meters.map((m) => ({ character: m.character, magical: m.magical, physical: m.physical, total: m.total, true: m.true }))

export const Recount: React.FC = () => {
    // const metersRef = useRef<DamageMeter[]>([])
    const [snap, setSnap] = useState<DamageMeter[]>([])

    // useEffect(() => {
    //     const id = setInterval(() => setSnap(makeSnap(metersRef.current)), 500)
    //     return () => clearInterval(id)
    // }, [])

    useEffect(() => {
        const handler = (damages: DamageMeter[]) => {
            setSnap(makeSnap(damages))
        }
        EventBus.on("damage-chart", handler)
        EventBus.emit("request-damage-chart")
        return () => {
            EventBus.off("damage-chart", handler)
        }
    }, [])

    const highestDamage = useMemo(() => snap.reduce((h, m) => (m.total > h ? m.total : h), 0), [snap])

    return (
        <Paper sx={{ display: "flex", flexDirection: "column", bgcolor: "#ffffff05", p: 1, gap: 1, width: 150 }} elevation={1}>
            {snap
                .slice()
                .sort((a, b) => b.total - a.total)
                .map((m) => (
                    <MeterComponent key={m.character.id} highest_damage={highestDamage} meter={m} />
                ))}
        </Paper>
    )
}

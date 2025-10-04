import React from "react"
import { DamageMeter, HealingMeter } from "../../game/tools/DamageChart"
import { MeterComponent } from "./MeterComponent"

interface DamageChartProps {
    charts: (DamageMeter | HealingMeter)[]
    highestvalue: number
}

export const GroupChart: React.FC<DamageChartProps> = (props) => {
    return props.charts
        .slice()
        .sort((a, b) => b.total - a.total)
        .map((m) => <MeterComponent key={m.character.id} highest_damage={props.highestvalue} meter={m} />)
}

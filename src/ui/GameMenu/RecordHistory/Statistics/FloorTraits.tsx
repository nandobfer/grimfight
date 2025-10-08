import React, { useMemo } from "react"
import { Paper, Typography } from "@mui/material"
import { GameRecord } from "../../../../game/systems/GameRecord"
import { CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Bar, BarChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { TraitsRegistry } from "../../../../game/systems/Traits/TraitsRegistry"

interface FloorCharactersProps {
    records: GameRecord[]
    y: string
    color: string
}

const getTraits = (record: GameRecord) => {
    const compSet = new Set(record.comp.map((char) => char.name))
    const traits = TraitsRegistry.compTraits(Array.from(compSet))
    for (const trait of traits) {
        for (const char of compSet) {
            if (trait.comp.includes(char)) {
                trait.activeComp.add(char)
            }
        }
        trait.getActiveStage()
    }

    return traits.filter((trait) => trait.activeStage > 0)
}

export const FloorTraits: React.FC<FloorCharactersProps> = (props) => {

    const data = useMemo(() => {
        const data = new Map()

        props.records.forEach((record) => {
            if (!record.finishedAt) return

            const traits = getTraits(record)

            traits.forEach((trait) => {
                const existing = data.get(trait.name)

                if (existing) {
                    if (record.floor > existing.floor) {
                        data.set(trait.name, { trait: trait.name, floor: record.floor, count: existing.count + 1 })
                    }
                } else {
                    data.set(trait.name, { trait: trait.name, floor: record.floor, count: 1 })
                }
            })
        })

        return Array.from(data.values()).sort((a, b) => a.floor - b.floor)
    }, [props.records])

    return (
        
        <ResponsiveContainer width="100%" height={200}>
            {/* <BarChart data={data}>
                <XAxis dataKey={"trait"} />
                <Tooltip
                    content={({ payload }) => {
                        if (!payload || payload.length === 0) return null
                        const { trait, floor, count } = payload[0].payload
                        return (
                            <Paper elevation={5} style={{ flexDirection: "column", padding: 5 }}>
                                <Typography>
                                    <strong>Trait:</strong> {trait}
                                </Typography>
                                <Typography>
                                    <strong>Max floor:</strong> {floor}
                                </Typography>
                                <Typography>
                                    <strong>Total games:</strong> {count}
                                </Typography>
                            </Paper>
                        )
                    }}
                />
                <CartesianGrid strokeDasharray="3 3" />

                <Bar dataKey={props.y} fill={props.color} />
            </BarChart> */}
            <RadarChart data={data} title="Traits">
                <PolarGrid />
                <PolarAngleAxis dataKey="trait" />
                <PolarRadiusAxis angle={30} domain={[0, "dataMax"]} />
                <Tooltip
                    content={({ payload }) => {
                        if (!payload || payload.length === 0) return null
                        const { trait, floor, count } = payload[0].payload
                        return (
                            <Paper elevation={5} style={{ flexDirection: "column", padding: 5 }}>
                                <Typography>
                                    <strong>Trait:</strong> {trait}
                                </Typography>
                                <Typography>
                                    <strong>Max floor:</strong> {floor}
                                </Typography>
                                <Typography>
                                    <strong>Total games:</strong> {count}
                                </Typography>
                            </Paper>
                        )
                    }}
                />
                <Radar dataKey={props.y} fill={props.color} fillOpacity={0.6} />
                </RadarChart>
        </ResponsiveContainer>
    )
}

import React, { useMemo } from "react"
import { Paper, Typography } from "@mui/material"
import { GameRecord } from "../../../../game/systems/GameRecord"
import { CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Bar, BarChart, Legend } from "recharts"

interface FloorCharactersProps {
    records: GameRecord[]
    y: string
    color: string
}

export const FloorCharacters: React.FC<FloorCharactersProps> = (props) => {

    const data = useMemo(() => {
        const data = new Map()

        props.records.forEach((record) => {
            if (!record.finishedAt) return

            record.comp.forEach((character) => {
                const existing = data.get(character.name)

                if (existing) {
                    if (record.floor > existing.floor) {
                        data.set(character.name, { character: character.name, floor: record.floor, count: existing.count+1 })
                    }
                } else {
                    data.set(character.name, { character: character.name, floor: record.floor, count: 1})
                }
            })
        })

        return Array.from(data.values()).sort((a, b) => a.floor - b.floor)
    }, [props.records])

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} title="Characters">
                <XAxis dataKey={"character"} />
                {/* <YAxis dataKey={"floor"} /> */}
                <Tooltip 
                    content={({ payload }) => {
                        if (!payload || payload.length === 0) return null;
                        const { character, floor, count } = payload[0].payload;
                        return (
                            <Paper elevation={5} style={{ flexDirection: 'column', padding: 5 }}>
                                <Typography><strong>Character:</strong> {character}</Typography>
                                <Typography><strong>Max floor:</strong> {floor}</Typography>
                                <Typography><strong>Total games:</strong> {count}</Typography>
                            </Paper>
                        )
                    }}
                />
                {/* <Legend /> */}
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey={props.y} fill={props.color} />
            </BarChart>
        </ResponsiveContainer>
    )
}

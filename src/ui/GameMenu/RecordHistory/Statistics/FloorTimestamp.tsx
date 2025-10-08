import React, { useMemo } from "react"
import { GameRecord } from "../../../../game/systems/GameRecord"
import { AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, Area, ResponsiveContainer } from "recharts"
import { Paper, Typography } from "@mui/material"

interface FloorTimestampProps {
    records: GameRecord[]
    y: string
    color: string
}

export const FloorTimestamp: React.FC<FloorTimestampProps> = (props) => {
    const data = useMemo(() => {
        const data = new Map()

        props.records.forEach((record) => {
            if (!record.finishedAt) return

            const timestamp = new Date(record.finishedAt).toLocaleDateString()

            const existing = data.get(timestamp)
            if (existing) {
                if (record.floor > existing.floor) {
                    data.set(timestamp, { finishedAt: timestamp, floor: record.floor, count: existing.count + 1 })
                }
            } else {
                data.set(timestamp, { finishedAt: timestamp, floor: record.floor, count: 1 })
            }
        })

        return Array.from(data.values()).sort((a, b) => a.floor - b.floor)
    }, [props.records])

    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
                <XAxis dataKey={"finishedAt"} />
                <YAxis />
                <Tooltip
                    content={({ payload }) => {
                        if (!payload || payload.length === 0) return null
                        const { finishedAt, floor, count } = payload[0].payload
                        return (
                            <Paper elevation={5} style={{ flexDirection: "column", padding: 5 }}>
                                <Typography>
                                    <strong>Date:</strong> {finishedAt}
                                </Typography>
                                <Typography>
                                    <strong>Floor reached:</strong> {floor}
                                </Typography>
                                <Typography>
                                    <strong>Total games:</strong> {count}
                                </Typography>
                            </Paper>
                        )
                    }}
                />
                {/* <Legend /> */}
                <CartesianGrid strokeDasharray="3 3" />

                <Area dataKey={props.y} fill={props.color} type="monotone" />
            </AreaChart>
        </ResponsiveContainer>
    )
}

import { useMemo, useState } from "react"
import { Box, Button, Paper, Typography, useTheme } from "@mui/material"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { GameRecordStatistics, type RecordMetric, type RecordRanking } from "../../../../game/systems/GameRecordStatistics"
import { HistoryChartTooltip } from "./HistoryChartTooltip"

export const RecordRankingChart = ({ title, entries, estimated = false }: { title: string; entries: RecordRanking[]; estimated?: boolean }) => {
    const theme = useTheme()
    const [metric, setMetric] = useState<RecordMetric>("floor")
    const [expanded, setExpanded] = useState(false)
    const ranked = useMemo(() => GameRecordStatistics.rank(entries, metric), [entries, metric])
    const data = expanded ? ranked : ranked.slice(0, 10)
    const color = metric === "floor" ? theme.palette.primary.main : theme.palette.info.main
    return (
        <Paper variant="outlined" sx={{ display: "block", p: { xs: 1.5, sm: 2 }, minWidth: 0, flexShrink: 1 }}>
            <Typography variant="h6">{title}</Typography>
            <Box sx={{ flexWrap: "wrap", gap: 1, my: 1 }}>
                <Button size="small" variant={metric === "floor" ? "contained" : "outlined"} onClick={() => setMetric("floor")}>Melhor andar</Button>
                <Button size="small" variant={metric === "count" ? "contained" : "outlined"} onClick={() => setMetric("count")}>Runs registradas</Button>
            </Box>
            <Typography variant="caption" color="text.secondary" component="p">Baseado na composição final de cada run.</Typography>
            {estimated && <Typography variant="caption" color="warning.main" component="p">Traits de registros antigos estimadas pelas regras atuais.</Typography>}
            {data.length === 0 ? <Typography sx={{ py: 3 }} color="text.secondary">Nenhum dado disponível para este ranking.</Typography> : (
                <Box sx={{ display: "block", width: 1, minWidth: 0, height: Math.max(160, data.length * 34 + 45), mt: 1 }} role="img" aria-label={`${title}: ${metric === "floor" ? "melhor andar" : "runs registradas"}`}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 0 }} accessibilityLayer>
                            <CartesianGrid stroke={theme.palette.divider} horizontal={false} />
                            <XAxis type="number" allowDecimals={false} domain={[0, "auto"]} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" width={100} interval={0} tickLine={false} tick={{ fill: theme.palette.text.primary, fontSize: 11 }} tickFormatter={(name: string) => name.length > 14 ? `${name.slice(0, 13)}…` : name} />
                            <Tooltip cursor={{ fill: theme.palette.action.hover }} content={({ active, label }) => {
                                const entry = data.find((item) => item.name === label)
                                return active && entry ? <HistoryChartTooltip title={entry.name} floor={entry.floor} count={entry.count} metric={metric} /> : null
                            }} />
                            <Bar dataKey={metric} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                                <LabelList dataKey={metric} position="right" fill={theme.palette.text.primary} fontSize={12} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            )}
            {ranked.length > 10 && <Button size="small" onClick={() => setExpanded(!expanded)}>{expanded ? "Mostrar top 10" : `Mostrar todos (${ranked.length})`}</Button>}
        </Paper>
    )
}

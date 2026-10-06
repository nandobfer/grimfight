import { Box, Paper, Typography, useTheme } from "@mui/material"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { RecordDay, RecordMetric } from "../../../../game/systems/GameRecordStatistics"
import { HistoryChartTooltip } from "./HistoryChartTooltip"

const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })

export const FloorTimestamp = ({ days }: { days: RecordDay[] }) => {
    const theme = useTheme()
    if (!days.length) return null
    const domain: [number, number] = [days[0].timestamp - 43200000, days[days.length - 1].timestamp + 43200000]
    const axes = (metric: RecordMetric) => <>
        <CartesianGrid stroke={theme.palette.divider} vertical={false} />
        <XAxis type="number" scale="time" dataKey="timestamp" domain={domain} tickFormatter={formatDate} minTickGap={40} ticks={days.length <= 6 ? days.map((day) => day.timestamp) : undefined} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
        <YAxis allowDecimals={false} domain={[0, "auto"]} width={40} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
        <Tooltip content={({ active, label }) => {
            const entry = days.find((day) => day.timestamp === Number(label))
            return active && entry ? <HistoryChartTooltip title={new Date(entry.timestamp).toLocaleDateString("pt-BR")} floor={entry.floor} count={entry.count} metric={metric} /> : null
        }} />
    </>
    return (
        <Paper variant="outlined" sx={{ display: "block", p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
            <Typography variant="h6">Evolução por data</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Resultados das runs encerradas em cada dia. Dias sem runs não representam andar zero.</Typography>
            <Typography variant="subtitle2">Melhor andar por dia</Typography>
            <Box sx={{ display: "block", width: 1, height: 220, minWidth: 0 }} role="img" aria-label="Melhor andar por dia em ordem cronológica">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={days} margin={{ top: 15, right: 15, bottom: 5, left: 0 }} accessibilityLayer>
                        {axes("floor")}
                        <Line type="linear" dataKey="floor" name="Melhor andar" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Runs encerradas por dia</Typography>
            <Box sx={{ display: "block", width: 1, height: 180, minWidth: 0 }} role="img" aria-label="Quantidade de runs encerradas por dia">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={days} margin={{ top: 15, right: 15, bottom: 5, left: 0 }} accessibilityLayer>
                        {axes("count")}
                        <Bar dataKey="count" name="Runs registradas" fill={theme.palette.info.main} barSize={18} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    )
}

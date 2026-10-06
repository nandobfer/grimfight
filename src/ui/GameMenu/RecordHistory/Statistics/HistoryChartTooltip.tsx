import { Paper, Typography } from "@mui/material"
import type { RecordMetric } from "../../../../game/systems/GameRecordStatistics"

export const HistoryChartTooltip = ({ title, floor, count, metric }: { title: string; floor: number; count: number; metric: RecordMetric }) => (
    <Paper elevation={6} sx={{ display: "block", p: 1.5, border: 1, borderColor: "divider", pointerEvents: "none" }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2" sx={{ fontWeight: metric === "floor" ? 700 : 400 }}>Melhor andar: {floor}</Typography>
        <Typography variant="body2" sx={{ fontWeight: metric === "count" ? 700 : 400 }}>Runs registradas: {count}</Typography>
    </Paper>
)

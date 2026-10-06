import { useMemo, useState } from "react"
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Paper, Tab, Tabs, Typography } from "@mui/material"
import type { ButtonProps } from "@mui/material/Button"
import { Close } from "@mui/icons-material"
import type { Game } from "../../../game/scenes/Game"
import { GameRecordStatistics } from "../../../game/systems/GameRecordStatistics"
import { GameRecordTraits } from "../../../game/systems/GameRecordTraits"
import { RecordItem } from "./RecordItem"
import { Statistics } from "./Statistics/Statistics"

interface RecordHistoryProps {
    game?: Game
    buttonLabel?: string
    buttonVariant?: ButtonProps["variant"]
    disabled?: boolean
}

const getSavedGameRecords = (): unknown => {
    try {
        return JSON.parse(localStorage.getItem("gamerecords") ?? "[]") as unknown
    } catch {
        return []
    }
}

export const RecordHistory = ({ game, buttonLabel, buttonVariant, disabled }: RecordHistoryProps) => {
    const [open, setOpen] = useState(false)
    const [records, setRecords] = useState<unknown>([])
    const [tab, setTab] = useState<"statistics" | "runs">("statistics")
    const statistics = useMemo(() => new GameRecordStatistics(records, GameRecordTraits.fromComposition), [records])
    const openMenu = () => {
        setRecords(game?.getSavedGameRecords() ?? getSavedGameRecords())
        setTab("statistics")
        setOpen(true)
    }
    const closeMenu = () => {
        setOpen(false)
        // The parent menu owns the paused game; closing its history does not resume it.
    }
    const latest = statistics.records[0]
    const summary = [
        { label: "Runs registradas", value: String(statistics.records.length) },
        { label: "Melhor andar", value: latest ? String(statistics.bestFloor) : "—" },
        { label: "Andar médio", value: latest ? statistics.averageFloor.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—" },
        { label: "Última run", value: latest ? `Andar ${latest.floor}` : "—", detail: latest ? new Date(latest.finishedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : undefined },
    ]
    return (
        <>
            <Button variant={buttonVariant ?? "text"} disabled={disabled} onClick={openMenu}>{buttonLabel ?? "Histórico"}</Button>
            <Dialog open={open} onClose={closeMenu} fullWidth maxWidth="lg" aria-labelledby="record-history-title"
                slotProps={{ paper: { elevation: 4, sx: { p: 0, gap: 0, width: { xs: "calc(100% - 16px)", sm: "100%" }, m: { xs: 1, sm: 4 }, maxHeight: "90dvh", overflow: "hidden" } } }}>
                <DialogTitle id="record-history-title" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                    Histórico de runs
                    <IconButton aria-label="Fechar histórico" onClick={closeMenu}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: "block", minWidth: 0, p: { xs: 1.5, sm: 3 }, pt: { xs: 0, sm: 0 } }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.5, mb: 2 }}>
                        {summary.map((card) => <Paper key={card.label} variant="outlined" sx={{ display: "block", minWidth: 0, p: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{card.value}</Typography>
                            {card.detail && <Typography variant="caption" color="text.secondary">{card.detail}</Typography>}
                        </Paper>)}
                    </Box>
                    <Tabs value={tab} onChange={(_event, value: "statistics" | "runs") => setTab(value)} aria-label="Visualização do histórico" sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
                        <Tab value="statistics" label="Estatísticas" id="history-statistics-tab" aria-controls="history-statistics-panel" />
                        <Tab value="runs" label={`Runs (${statistics.records.length})`} id="history-runs-tab" aria-controls="history-runs-panel" />
                    </Tabs>
                    {tab === "statistics" ? <Box role="tabpanel" id="history-statistics-panel" aria-labelledby="history-statistics-tab" sx={{ display: "block", minWidth: 0 }}>
                        <Statistics statistics={statistics} />
                    </Box> : <Box role="tabpanel" id="history-runs-panel" aria-labelledby="history-runs-tab" sx={{ flexDirection: "column", gap: 2, minWidth: 0 }}>
                        {statistics.records.length === 0 && <Typography color="text.secondary" sx={{ py: 3 }}>Nenhuma run encerrada encontrada.</Typography>}
                        {statistics.records.map((record, index) => <RecordItem record={record} key={`${record.finishedAt}-${index}`} />)}
                    </Box>}
                </DialogContent>
            </Dialog>
        </>
    )
}

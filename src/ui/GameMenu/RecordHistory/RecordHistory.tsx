import React, { useEffect, useState } from "react"
import { Box, Button, Dialog, IconButton, Paper, Typography } from "@mui/material"
import { ButtonProps } from "@mui/material/Button"
import { Game } from "../../../game/scenes/Game"
import { GameRecord } from "../../../game/systems/GameRecord"
import { Close } from "@mui/icons-material"
import { RecordItem } from "./RecordItem"
import { Statistics } from "./Statistics/Statistics"

interface RecordHistoryProps {
    game?: Game
    buttonLabel?: string
    buttonVariant?: ButtonProps["variant"]
    disabled?: boolean
}

const getSavedGameRecords = () => {
    try {
        const data = localStorage.getItem("gamerecords")
        if (data) {
            return JSON.parse(data) as GameRecord[]
        }
    } catch (error) {
        console.log(error)
    }
    return []
}

export const RecordHistory: React.FC<RecordHistoryProps> = (props) => {
    const [open, setOpen] = useState(false)
    const [records, setRecords] = useState<GameRecord[]>([])

    const openMenu = () => {
        setOpen(true)
    }

    const closeMenu = () => {
        setOpen(false)
        props.game?.game.resume()
    }

    const getRecords = () => {
        const records = props.game?.getSavedGameRecords() ?? getSavedGameRecords()
        setRecords(records)
    }

    useEffect(() => {
        if (open) {
            getRecords()
            return () => {
                setRecords([])
            }
        }
    }, [open])

    return (
        <>
            <Button variant={props.buttonVariant ?? "text"} disabled={props.disabled} onClick={openMenu}>
                {props.buttonLabel ?? "History"}
            </Button>
            <Dialog open={open} onClose={closeMenu} slotProps={{ backdrop: { sx: { background: "transparent" } }, paper: { elevation: 1 } }}>
                <Box sx={{ justifyContent: "space-between" }}>
                    <Typography variant="h4">Game Records</Typography>
                    <IconButton onClick={closeMenu}>
                        <Close />
                    </IconButton>
                </Box>

                {/* Estatísticas */}
                <Statistics records={records} />

                {/* histórico */}
                <Paper sx={{ flex: 1, flexDirection: "column", padding: 1, gap: 2 }} elevation={0}>
                    {records.length === 0 && <Typography variant="body2">Nenhum histórico encontrado.</Typography>}
                    {[...records]
                        .sort((a, b) => (b.finishedAt || Date.now()) - (a.finishedAt || Date.now()))
                        .map((item, index) => (
                            <RecordItem record={item} key={`${item.finishedAt}-${index}`} />
                        ))}
                </Paper>

                {/* gráficos */}
                <Box sx={{ flex: 1, flexDirection: "column" }}></Box>
            </Dialog>
        </>
    )
}

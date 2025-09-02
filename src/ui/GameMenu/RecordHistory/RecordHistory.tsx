import React, { useEffect, useState } from "react"
import { Box, Button, Dialog, IconButton, Paper, Typography } from "@mui/material"
import { Game } from "../../../game/scenes/Game"
import { GameRecord } from "../../../game/systems/GameRecord"
import { Close } from "@mui/icons-material"
import { RecordItem } from "./RecordItem"

interface RecordHistoryProps {
    game: Game
}

export const RecordHistory: React.FC<RecordHistoryProps> = (props) => {
    const [open, setOpen] = useState(false)
    const [records, setRecords] = useState<GameRecord[]>([])

    const openMenu = () => {
        setOpen(true)
    }

    const closeMenu = () => {
        setOpen(false)
        // EventBus.emit('unpause')
        props.game.game.resume()
    }

    const toggleMenu = () => setOpen((value) => !value)

    const getRecords = () => {
        const records = props.game.getSavedGameRecords()
        console.log(records)
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
            <Button variant="text" onClick={openMenu}>
                Histórico
            </Button>
            <Dialog open={open} onClose={closeMenu} slotProps={{ backdrop: { sx: { background: "transparent" } }, paper: { elevation: 1 } }}>
                <Box sx={{ justifyContent: "space-between" }}>
                    <Typography variant="h4">Histórico de partidas</Typography>
                    <IconButton onClick={closeMenu}>
                        <Close />
                    </IconButton>
                </Box>

                {/* histórico */}
                <Paper sx={{ flex: 1, flexDirection: "column", padding: 1, gap: 2 }} elevation={0}>
                    {records
                        .sort((a, b) => b.finishedAt || Date.now() - a.finishedAt || Date.now())
                        .map((item) => (
                            <RecordItem record={item} key={item.finishedAt} />
                        ))}
                </Paper>

                {/* gráficos */}
                <Box sx={{ flex: 1, flexDirection: "column" }}></Box>
            </Dialog>
        </>
    )
}

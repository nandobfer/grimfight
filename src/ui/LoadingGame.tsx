import React, { useEffect, useState } from 'react'
import {Box, CircularProgress, LinearProgress} from '@mui/material'
import { EventBus } from "../game/tools/EventBus"
import { Logo } from "./components/Logo"

interface LoadingGameProps {}

export const LoadingGame: React.FC<LoadingGameProps> = (props) => {
    const [progress, setProgress] = useState(0)

    const handler = (progress: number) => {
        setProgress(progress)
    }

    useEffect(() => {
        EventBus.on("load-progress", handler)

        return () => {
            EventBus.off("load-progress", handler)
        }
    }, [])

    return (
        <Box sx={{ flexDirection: "column", width: 1, alignItems: "center", gap: 1 }}>
            <Logo />
            <LinearProgress variant="determinate" sx={{ width: 1 }} value={progress * 100} />
        </Box>
        // <CircularProgress variant='determinate' color='primary' value={progress} size={500} />
    )
}
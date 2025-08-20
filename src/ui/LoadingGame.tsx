import React, { useEffect, useState } from 'react'
import {Box, CircularProgress, LinearProgress} from '@mui/material'
import { EventBus } from "../game/tools/EventBus"

interface LoadingGameProps {
    
}

export const LoadingGame: React.FC<LoadingGameProps> = (props) => {
    const [progress, setProgress] = useState(0)

    const handler = (progress: number) => {
        setProgress(progress)
    }

    useEffect(() => {
        EventBus.on('load-progress', handler)

        return () => {
            EventBus.off('load-progress', handler)
        }
    }, [])
    
    return (
        <LinearProgress variant="determinate" sx={{ width: 1 }} value={progress} />
        // <CircularProgress variant='determinate' color='primary' value={progress} size={500} />
    )
}
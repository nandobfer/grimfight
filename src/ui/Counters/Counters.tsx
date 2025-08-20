import React, { useEffect, useState } from 'react'
import {Box} from '@mui/material'
import { CounterItem } from './CounterItem'
import { Game } from '../../game/scenes/Game'
import { EventBus } from '../../game/tools/EventBus'

interface CountersProps {
}

export const Counters: React.FC<CountersProps> = (props) => {
    const [playerGold, setPlayerGold] = useState(0)
    const [gameFloor, setGameFloor] = useState(1)
    const [playerLives, setPlayerLives] = useState(5)

    useEffect(() => {
        const handleFloorChange = (floor: number) => setGameFloor(floor)
        const handleGoldChange = (gold: number) => setPlayerGold(gold)
        const handleLivesChange = (lives: number) => setPlayerLives(lives)

        EventBus.on("floor-change", handleFloorChange)
        EventBus.on("lives-change", handleLivesChange)

        return () => {
            EventBus.off("floor-change", handleFloorChange)
            EventBus.off("lives-change", handleLivesChange)
        }
    }, [])
    
    return (
        <Box sx={{ gap: 1, alignItems: "flex-end", flexDirection: "column" }}>
            <CounterItem value={gameFloor} />
            <CounterItem value={playerLives} color="error.main" />
            <CounterItem value={playerGold} color="warning.main" />
        </Box>
    )
}
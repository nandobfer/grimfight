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

    useEffect(() => {
        const handleFloorChange = (floor:number) => setGameFloor(floor)
        const handleGoldChange = (gold: number) => setPlayerGold(gold)

        EventBus.on('floor-change', handleFloorChange)
        
        return () => {
            EventBus.off('floor-change', handleFloorChange)
        }
        
    }, [])
    
    return <Box sx={{gap: 1, alignItems: 'flex-end', flexDirection: 'column'}}>
            <CounterItem value={gameFloor} />
            <CounterItem value={playerGold} color='warning.main' />
        </Box>
}
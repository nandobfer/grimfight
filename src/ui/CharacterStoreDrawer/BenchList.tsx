import React, { useEffect, useState } from 'react'
import {Box} from '@mui/material'
import { Game } from '../../game/scenes/Game'
import { CharacterDto } from '../../game/creature/character/Character'
import { EventBus } from '../../game/tools/EventBus'
import { BenchItem } from './BenchItem'

interface BenchListProps {
    game: Game
}

export const BenchList: React.FC<BenchListProps> = (props) => {
    const [characters, setCharacters] = useState<CharacterDto[]>(props.game.playerTeam.bench.characters)
    
        useEffect(() => {
            const handler = (items: CharacterDto[]) => {
                console.log(items)
                setCharacters([...items])
            }
    
            EventBus.on("character-bench", handler)
    
            return () => {
                EventBus.off("character-bench", handler)
            }
        }, [])
    
    return (
        <Box sx={{marginTop: -1}}>
            {characters.map(dto => <BenchItem key={dto.id} character={dto} game={props.game} /> )}
            {new Array(props.game.max_bench_size-characters.length).fill(null).map((_, index) => <BenchItem key={index} game={props.game} />)}
        </Box>
    )
}
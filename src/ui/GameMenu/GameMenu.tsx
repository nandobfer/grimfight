import React, { useEffect, useState } from 'react'
import {Box, Button, Dialog, Typography} from '@mui/material'
import { Game } from '../../game/scenes/Game'
import { EventBus } from '../../game/tools/EventBus'
import { Logo } from '../components/Logo'
import { RecordHistory } from './RecordHistory/RecordHistory'

interface GameMenuProps {
    game: Game
}

export const GameMenu:React.FC<GameMenuProps> = (props) => {
    const [showMenu, setShowMenu] = useState(false)

    const openMenu = () => {
        setShowMenu(true)
    }

    const closeMenu = () => {
        setShowMenu(false)
        // EventBus.emit('unpause')
        props.game.game.resume()
    }

    const toggleMenu = () => setShowMenu(value => !value)

    useEffect(() => {
        EventBus.on('open-menu', openMenu)
        return () => {
            EventBus.off('open-menu')
        }
    }, [])
    
    return (
        <Dialog open={showMenu} onClose={closeMenu} slotProps={{backdrop: {sx: { backdropFilter: "blur(2px)"}}, paper: {elevation: 0}}}>
            <Logo />
                <Box sx={{flexDirection: 'column', gap: 1}}>
                    <Button disabled>carregar</Button>
                    <Button disabled>salvar como</Button>

                    <RecordHistory game={props.game} />
                    <Button variant='outlined' onClick={closeMenu} >Voltar</Button>
                </Box>
        </Dialog>
    )
}
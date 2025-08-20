import React from 'react'
import { Box, Button } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { DebugFloor } from "./DebugFloor"

interface DebugMenuProps {
    game: Game
}

export const DebugMenu: React.FC<DebugMenuProps> = (props) => {
    const game = props.game

    const clearSavedChars = () => {
        game.clearAllCharacters()
    }

    const addChar = () => {
        game.chooseNewCharacter()
    }

    

    return (
        <Box sx={{ flexDirection: "column", gap: 1 }}>
            <Button onClick={clearSavedChars}>clear saved chars</Button>
            <Button onClick={addChar}>add char</Button>
            <DebugFloor game={game} />
        </Box>
    )
}
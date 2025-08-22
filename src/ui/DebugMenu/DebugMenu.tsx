import React from 'react'
import { Box, Button } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { DebugFloor } from "./DebugFloor"
import { DebugGold } from "./DebugGold"

interface DebugMenuProps {
    game: Game
}

export const DebugMenu: React.FC<DebugMenuProps> = (props) => {
    const game = props.game

    const clearSavedChars = () => {
        game.clearAllCharacters()
    }

    const addChar = () => {
        game.generateFirstCharacter()
    }

    const resetGame = () => {
        game.gameOver()
    }

    return (
        <Box sx={{ flexDirection: "column", gap: 1 }}>
            {/* <Button onClick={clearSavedChars}>clear characters</Button> */}
            <Button onClick={resetGame}>reset game</Button>
            <DebugFloor game={game} />
            <DebugGold game={game} />
        </Box>
    )
}
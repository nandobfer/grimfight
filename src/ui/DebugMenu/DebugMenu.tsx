import React, { useState } from "react"
import { Box, Button, ClickAwayListener, IconButton, Paper, Popper } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { DebugFloor } from "./DebugFloor"
import { DebugGold } from "./DebugGold"
import { Code } from "@mui/icons-material"
import { DebugCharacter } from "./DebugCharacter"
import { DebugItems } from "./DebugItems"

interface DebugMenuProps {
    game: Game
}

export const DebugMenu: React.FC<DebugMenuProps> = (props) => {
    const game = props.game
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const resetGame = () => {
        game.gameOver(false)
        closeMenu()
    }

    const resetRound = () => {
        game.resetFloor()
        closeMenu()
    }

    const closeMenu = () => {
        setAnchorEl(null)
    }

    return (
        <ClickAwayListener onClickAway={closeMenu}>
            <Box sx={{ pointerEvents: "auto" }}>
                <IconButton onClick={(ev) => setAnchorEl(ev.currentTarget)} sx={{ alignSelf: "end" }} size="small">
                    <Code />
                </IconButton>

                <Popper open={!!anchorEl} anchorEl={anchorEl} placement="auto">
                    <Paper sx={{ flexDirection: "column", gap: 1, padding: 1, width: 300 }}>
                        <Button onClick={resetGame} color="error" variant="outlined">
                            reset game
                        </Button>
                        <Button onClick={resetRound}>reset round</Button>
                        <DebugFloor game={game} closeMenu={closeMenu} />
                        <DebugGold game={game} closeMenu={closeMenu} />
                        <DebugCharacter game={game} closeMenu={closeMenu} />
                        <DebugItems game={game} closeMenu={closeMenu} />
                    </Paper>
                </Popper>
            </Box>
        </ClickAwayListener>
    )
}

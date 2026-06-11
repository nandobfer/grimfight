import React, { useEffect, useState } from "react"
import { Box, Button, Dialog } from "@mui/material"
import { Game } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"
import { Logo } from "../components/Logo"
import { RecordHistory } from "./RecordHistory/RecordHistory"

interface GameMenuProps {
    game: Game
}

export const GameMenu: React.FC<GameMenuProps> = (props) => {
    const [showMenu, setShowMenu] = useState(false)

    const openMenu = () => {
        setShowMenu(true)
    }

    const closeMenu = () => {
        setShowMenu(false)
        // EventBus.emit('unpause')
        props.game.game.resume()
    }

    const quitToMenu = () => {
        if (props.game.state === "idle") {
            props.game.playerTeam.saveCurrentCharacters()
        }
        props.game.saveProgress()
        props.game.disposeSceneBindings()
        props.game.game.resume()
        setShowMenu(false)
        EventBus.emit("quit-to-menu")
    }

    useEffect(() => {
        EventBus.on("open-menu", openMenu)
        return () => {
            EventBus.off("open-menu", openMenu)
        }
    }, [])

    return (
        <Dialog open={showMenu} onClose={closeMenu} slotProps={{ backdrop: { sx: { backdropFilter: "blur(2px)" } }, paper: { elevation: 0 } }}>
            <Logo />
            <Box sx={{ flexDirection: "column", gap: 1 }}>
                <RecordHistory game={props.game} buttonLabel="Histórico" />
                <Button variant="outlined" color="secondary" onClick={quitToMenu}>
                    Sair
                </Button>
                <Button variant="outlined" onClick={closeMenu}>
                    Fechar Menu
                </Button>
            </Box>
        </Dialog>
    )
}

import React, { useEffect, useState } from "react"
import { Box, Button } from "@mui/material"
import { Game, GameState } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"

interface GameStateButtonsProps {
    game: Game
}

export const GameStateButtons: React.FC<GameStateButtonsProps> = (props) => {
    const [gameState, setGameState] = useState(props.game.state)
    const [storeOpen, setStoreOpen] = useState(true)

    const onPlayClick = () => {
        props.game.startRound()
    }

    useEffect(() => {
        const handler = (state: GameState) => setGameState(state)
        EventBus.on("gamestate", handler)

        return () => {
            EventBus.off("gamestate", handler)
        }
    }, [])

    useEffect(() => {
        const handler = (open: boolean) => setStoreOpen(open)
        EventBus.on("store-open-change", handler)

        return () => {
            EventBus.off("store-open-change", handler)
        }
    }, [])

    return (
        <Box
            sx={{
                position: "absolute",
                left: "50%",
                bottom: storeOpen ? { xs: 132, sm: 124 } : { xs: 16, sm: 24 },
                transform: "translateX(-50%)",
                zIndex: 2,
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                height: "min-content",
                transition: "bottom 180ms ease",
            }}
        >
            {gameState === "idle" && (
                <Button variant="outlined" onClick={onPlayClick} color="error" sx={{ alignSelf: "center" }}>
                    fight
                </Button>
            )}
        </Box>
    )
}

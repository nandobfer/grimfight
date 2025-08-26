import React, { useEffect, useState } from "react"
import { Box, Button, Divider } from "@mui/material"
import { Game, GameState } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"
import { DebugMenu } from "../DebugMenu/DebugMenu"

interface GameStateButtonsProps {
    game: Game
}

export const GameStateButtons: React.FC<GameStateButtonsProps> = (props) => {
    const [gameState, setGameState] = useState(props.game.state)

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

    return (
        <Box sx={{ pointerEvents: "auto", flexDirection: "column", gap: 1, height: "min-content" }}>
            {gameState === "idle" && (
                <Button variant="outlined" onClick={onPlayClick} color="error">
                    fight
                </Button>
            )}

            <Divider />
            {/* <DebugMenu game={props.game} /> */}
        </Box>
    )
}

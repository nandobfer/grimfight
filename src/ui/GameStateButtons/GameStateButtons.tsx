import React, { useEffect, useState } from "react"
import { Box, Button, Divider } from "@mui/material"
import { Game, GameState } from "../../game/scenes/Game"
import { EventBus } from "../../game/tools/EventBus"
import { DebugMenu } from "../DebugMenu/DebugMenu"
import { CharacterStoreDrawer } from "../CharacterStoreDrawer/CharacterStoreDrawer"

interface GameStateButtonsProps {
    game: Game
}

export const GameStateButtons: React.FC<GameStateButtonsProps> = (props) => {
    const [gameState, setGameState] = useState(props.game.state)

    const onResetClick = () => {
        props.game.playerTeam.reset()
        props.game.enemyTeam.reset()
    }

    const onPlayClick = () => {
        props.game.startRound()
    }

    const onStopClick = () => {
        props.game.changeState("idle")
        onResetClick()
    }

    useEffect(() => {
        const handler = (state: GameState) => setGameState(state)
        EventBus.on("gamestate", handler)

        return () => {
            EventBus.off("gamestate", handler)
        }
    }, [])

    return (
        <Box sx={{ pointerEvents: "auto", flexDirection: "column", gap: 1, height: "min-content", marginTop: "auto" }}>
            {gameState === "idle" && (
                <Button variant="outlined" onClick={onPlayClick}>
                    fight
                </Button>
            )}

            <Divider />
            <DebugMenu game={props.game} />
        </Box>
    )
}

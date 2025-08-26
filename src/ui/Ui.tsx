import React, { useEffect, useState } from "react"
import { Box, ThemeProvider } from "@mui/material"
import { EventBus } from "../game/tools/EventBus"
import { useMuiTheme } from "./hooks/useMuiTheme"
import { GameStateButtons } from "./GameStateButtons/GameStateButtons"
import { useGameScene } from "./hooks/useGameScene"
import { CharactersRow } from "./CharacterSheet/CharactersRow"
import { LoadingGame } from "./LoadingGame"
import { Recount } from "./Recount/Recount"
import { Counters } from "./Counters/Counters"
import { CharacterStoreDrawer } from "./CharacterStoreDrawer/CharacterStoreDrawer"
import { AugmentModal } from "./AugmentModal/AugmentModal"
import { GameState } from "../game/scenes/Game"

interface UiProps {}

export const Ui: React.FC<UiProps> = (props) => {
    const theme = useMuiTheme()
    const game = useGameScene()
    const [loading, setLoading] = useState(true)
    const [gameState, setGameState] = useState<GameState>(game?.state || "idle")

    const finishLoading = () => {
        setLoading(false)
    }

    useEffect(() => {
        // EventBus.on("choose-character", handleFirstCharacterEmitted)
        EventBus.on("load-complete", finishLoading)

        return () => {
            // EventBus.off("choose-character", handleFirstCharacterEmitted)
            EventBus.off("load-complete", finishLoading)
        }
    }, [])

    useEffect(() => {
        const handler = (state: GameState) => setGameState(state)
        EventBus.on("gamestate", handler)

        return () => {
            EventBus.off("gamestate", handler)
        }
    }, [])

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: 5,
                    // border: "1px solid red",
                    pointerEvents: "none",
                    justifyContent: "space-between",
                }}
            >
                {loading && <LoadingGame />}
                {game && (
                    <>
                        {gameState === "idle" && (
                            <Box sx={{ flexDirection: "column", height: 1, pointerEvents: "none" }}>
                                <CharactersRow charactersGroup={game.playerTeam} />
                                <CharacterStoreDrawer game={game} />
                            </Box>
                        )}
                        <Box sx={{ flexDirection: "column", marginLeft: "auto" }}>
                            <Counters />
                            <Box sx={{ flexDirection: "column", marginTop: "auto" }}>
                                <Recount />
                                <GameStateButtons game={game} />
                            </Box>
                        </Box>
                    </>
                )}
            </Box>

            {game && <AugmentModal team={game.playerTeam} />}
        </ThemeProvider>
    )
}

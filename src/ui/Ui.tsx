import React, { useEffect, useState } from "react"
import { Box, ThemeProvider } from "@mui/material"
import { EventBus } from "../game/tools/EventBus"
import { useMuiTheme } from "./hooks/useMuiTheme"
import { GameStateButtons } from "./GameStateButtons/GameStateButtons"
import { NewCharacterModal } from "./NewCharacterModal/NewCharacterModal"
import { useGameScene } from "./hooks/useGameScene"
import { CharactersRow } from "./CharacterSheet/CharactersRow"
import { LoadingGame } from "./LoadingGame"
import { Recount } from "./Recount/Recount"
import { Counters } from "./Counters/Counters"
import { CharacterStoreDrawer } from "./CharacterStoreDrawer/CharacterStoreDrawer"

interface UiProps {}

export const Ui: React.FC<UiProps> = (props) => {
    const theme = useMuiTheme()
    const game = useGameScene()
    const [chooseCharacterModalOpen, setChooseCharacterModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    const handleFirstCharacterEmitted = () => {
        setChooseCharacterModalOpen(true)
    }

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
                        <Box sx={{ flexDirection: "column", height: 1, pointerEvents: "none" }}>
                            <CharactersRow charactersGroup={game.playerTeam} />
                            <CharacterStoreDrawer game={game} />
                        </Box>
                        <Box sx={{ flexDirection: "column" }}>
                            <Counters />
                            <Box sx={{ flexDirection: "column", marginTop: "auto" }}>
                                <Recount />
                                <GameStateButtons game={game} />
                            </Box>
                        </Box>
                    </>
                )}
            </Box>

            <NewCharacterModal open={chooseCharacterModalOpen} handleClose={() => setChooseCharacterModalOpen(false)} />
        </ThemeProvider>
    )
}
